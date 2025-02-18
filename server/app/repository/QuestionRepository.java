package repository;

import static com.google.common.base.Preconditions.checkNotNull;
import static java.util.concurrent.CompletableFuture.supplyAsync;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import io.ebean.DB;
import io.ebean.Database;
import io.ebean.Transaction;
import io.ebean.TxScope;
import java.util.Comparator;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletionStage;
import java.util.stream.Stream;
import javax.inject.Inject;
import javax.inject.Provider;
import models.Question;
import models.QuestionTag;
import models.Version;
import services.question.exceptions.UnsupportedQuestionTypeException;
import services.question.types.QuestionDefinition;
import services.question.types.QuestionDefinitionBuilder;

/**
 * QuestionRepository performs complicated operations on {@link Question} that often involve other
 * EBean models or asynchronous handling.
 */
public final class QuestionRepository {

  private final Database database;
  private final DatabaseExecutionContext executionContext;
  private final Provider<VersionRepository> versionRepositoryProvider;

  @Inject
  public QuestionRepository(
      DatabaseExecutionContext executionContext,
      ProgramRepository programRepository,
      Provider<VersionRepository> versionRepositoryProvider) {
    this.database = DB.getDefault();
    this.executionContext = checkNotNull(executionContext);
    this.versionRepositoryProvider = checkNotNull(versionRepositoryProvider);
  }

  public CompletionStage<Set<Question>> listQuestions() {
    return supplyAsync(() -> database.find(Question.class).findSet(), executionContext);
  }

  public CompletionStage<Optional<Question>> lookupQuestion(long id) {
    return supplyAsync(
        () -> database.find(Question.class).setId(id).findOneOrEmpty(), executionContext);
  }

  /**
   * Find and update the DRAFT of the question with this name, if one already exists. Create a new
   * DRAFT if there isn't one.
   */
  public Question createOrUpdateDraft(QuestionDefinition definition) {
    Version draftVersion = versionRepositoryProvider.get().getDraftVersion();
    try (Transaction transaction = database.beginTransaction(TxScope.requiresNew())) {
      Optional<Question> existingDraft = draftVersion.getQuestionByName(definition.getName());
      try {
        if (existingDraft.isPresent()) {
          Question updatedDraft =
              new Question(
                  new QuestionDefinitionBuilder(definition).setId(existingDraft.get().id).build());
          this.updateQuestionSync(updatedDraft);
          transaction.commit();
          return updatedDraft;
        }
        Question newDraftQuestion =
            new Question(new QuestionDefinitionBuilder(definition).setId(null).build());
        insertQuestionSync(newDraftQuestion);
        // Fetch the tags off the old question.
        Question oldQuestion = new Question(definition);
        oldQuestion.refresh();
        oldQuestion.getQuestionTags().forEach(newDraftQuestion::addTag);

        newDraftQuestion.addVersion(draftVersion).save();
        draftVersion.refresh();

        // Update other questions that may reference the previous revision.
        if (definition.isEnumerator()) {
          transaction.setNestedUseSavepoint();
          updateAllRepeatedQuestions(newDraftQuestion.id, definition.getId());
        }

        // Update programs that reference the previous question. A bit round about but this will
        // update all questions
        // in the program to their latest version, including the one here.
        transaction.setNestedUseSavepoint();
        versionRepositoryProvider.get().updateProgramsThatReferenceQuestion(definition.getId());
        transaction.commit();
        return newDraftQuestion;
      } catch (UnsupportedQuestionTypeException e) {
        // This should not be able to happen since the provided question definition is inherently
        // valid.
        // Throw runtime exception so callers don't have to deal with it.
        throw new RuntimeException(e);
      }
    }
  }

  /**
   * Update DRAFT and ACTIVE questions that reference {@code oldEnumeratorId} to reference {@code
   * newEnumeratorId}.
   */
  public void updateAllRepeatedQuestions(long newEnumeratorId, long oldEnumeratorId) {
    // TODO: This seems error prone as a question could be present as a DRAFT and ACTIVE.
    // Investigate further.
    Stream.concat(
            versionRepositoryProvider.get().getDraftVersion().getQuestions().stream(),
            versionRepositoryProvider.get().getActiveVersion().getQuestions().stream())
        // Find questions that reference the old enumerator ID.
        .filter(
            question ->
                question
                    .getQuestionDefinition()
                    .getEnumeratorId()
                    .equals(Optional.of(oldEnumeratorId)))
        // Update to the new enumerator ID.
        .forEach(
            question -> {
              try {
                createOrUpdateDraft(
                    new QuestionDefinitionBuilder(question.getQuestionDefinition())
                        .setEnumeratorId(Optional.of(newEnumeratorId))
                        .build());
              } catch (UnsupportedQuestionTypeException e) {
                // All question definitions are looked up and should be valid.
                throw new RuntimeException(e);
              }
            });
  }

  /**
   * Maybe find a {@link Question} that conflicts with {@link QuestionDefinition}.
   *
   * <p>This is intended to be used for new question definitions, since updates will collide with
   * themselves and previous versions, and new versions of an old question will conflict with the
   * old question.
   *
   * <p>Questions collide if they share a {@link QuestionDefinition#getQuestionPathSegment()} and
   * {@link QuestionDefinition#getEnumeratorId()}.
   */
  public Optional<Question> findConflictingQuestion(QuestionDefinition newQuestionDefinition) {
    ConflictDetector conflictDetector =
        new ConflictDetector(
            newQuestionDefinition.getEnumeratorId(),
            newQuestionDefinition.getQuestionPathSegment(),
            newQuestionDefinition.getName());
    database
        .find(Question.class)
        .findEachWhile(question -> !conflictDetector.hasConflict(question));
    return conflictDetector.getConflictedQuestion();
  }

  /** Get the questions with the specified tag which are in the active version. */
  public ImmutableList<QuestionDefinition> getAllQuestionsForTag(QuestionTag tag) {
    Version active = versionRepositoryProvider.get().getActiveVersion();
    ImmutableSet<Long> activeQuestionIds =
        active.getQuestions().stream().map(q -> q.id).collect(ImmutableSet.toImmutableSet());
    return database
        .find(Question.class)
        .where()
        .arrayContains("question_tags", tag)
        .findList()
        .stream()
        .filter(question -> activeQuestionIds.contains(question.id))
        .sorted(Comparator.comparing(question -> question.getQuestionDefinition().getName()))
        .map(Question::getQuestionDefinition)
        .collect(ImmutableList.toImmutableList());
  }

  public ImmutableMap<String, QuestionDefinition> getExistingQuestions(
      ImmutableSet<String> questionNames) {
    // We need to retrieve the latest id for each question since multiple versions of a question
    // with the same name can exist. We achieve this by a custom merge function that chooses the
    // value with the greater ID.
    return database
        .find(Question.class)
        .where()
        .in("name", questionNames)
        .orderBy()
        .asc("id")
        .findList()
        .stream()
        .map(Question::getQuestionDefinition)
        .collect(
            ImmutableMap.toImmutableMap(
                QuestionDefinition::getName,
                q -> q,
                (q1, q2) -> q1.getId() > q2.getId() ? q1 : q2));
  }

  private static final class ConflictDetector {
    private Optional<Question> conflictedQuestion = Optional.empty();
    private final Optional<Long> enumeratorId;
    private final String questionPathSegment;
    private final String questionName;

    private ConflictDetector(
        Optional<Long> enumeratorId, String questionPathSegment, String questionName) {
      this.enumeratorId = checkNotNull(enumeratorId);
      this.questionPathSegment = checkNotNull(questionPathSegment);
      this.questionName = checkNotNull(questionName);
    }

    private Optional<Question> getConflictedQuestion() {
      return conflictedQuestion;
    }

    private boolean hasConflict(Question question) {
      QuestionDefinition definition = question.getQuestionDefinition();
      boolean isSameName = definition.getName().equals(questionName);
      boolean isSameEnumId = definition.getEnumeratorId().equals(enumeratorId);
      boolean isSamePath = definition.getQuestionPathSegment().equals(questionPathSegment);
      if (isSameName || (isSameEnumId && isSamePath)) {
        conflictedQuestion = Optional.of(question);
        return true;
      }
      return false;
    }
  }

  public CompletionStage<Question> insertQuestion(Question question) {
    return supplyAsync(
        () -> {
          database.insert(question);
          return question;
        },
        executionContext);
  }

  public Question insertQuestionSync(Question question) {
    database.insert(question);
    return question;
  }

  public CompletionStage<Question> updateQuestion(Question question) {
    return supplyAsync(
        () -> {
          database.update(question);
          return question;
        },
        executionContext);
  }

  public Question updateQuestionSync(Question question) {
    database.update(question);
    return question;
  }
}
