package controllers.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static play.api.test.CSRFTokenHelper.addCSRFToken;
import static play.mvc.Http.Status.OK;
import static play.mvc.Http.Status.SEE_OTHER;
import static play.test.Helpers.contentAsString;

import com.google.common.collect.ImmutableMap;
import java.util.Optional;
import models.DisplayMode;
import models.Program;
import org.junit.Before;
import org.junit.Test;
import play.mvc.Http.Request;
import play.mvc.Http.RequestBuilder;
import play.mvc.Result;
import play.test.Helpers;
import repository.ProgramRepository;
import repository.ResetPostgres;
import repository.VersionRepository;
import services.program.ProgramNotFoundException;
import support.ProgramBuilder;
import views.html.helper.CSRF;

public class AdminProgramControllerTest extends ResetPostgres {

  private AdminProgramController controller;
  private ProgramRepository programRepository;
  private VersionRepository versionRepository;

  @Before
  public void setupController() {
    controller = instanceOf(AdminProgramController.class);
  }

  @Before
  public void setupProgramRepository() {
    programRepository = instanceOf(ProgramRepository.class);
  }

  @Before
  public void setupVersionRepository() {
    versionRepository = instanceOf(VersionRepository.class);
  }

  @Test
  public void index_withNoPrograms() {
    Result result = controller.index(Helpers.fakeRequest().build());
    assertThat(result.status()).isEqualTo(OK);
    assertThat(result.contentType()).hasValue("text/html");
    assertThat(result.charset()).hasValue("utf-8");
    assertThat(contentAsString(result)).contains("Programs");
  }

  @Test
  public void index_returnsPrograms() {
    ProgramBuilder.newDraftProgram("one").build();
    ProgramBuilder.newDraftProgram("two").build();

    Request request = addCSRFToken(Helpers.fakeRequest()).build();
    Result result = controller.index(request);

    assertThat(result.status()).isEqualTo(OK);
    assertThat(contentAsString(result)).contains("one");
    assertThat(contentAsString(result)).contains("two");
  }

  @Test
  public void newOne_returnsExpectedForm() {
    Request request = addCSRFToken(Helpers.fakeRequest()).build();

    Result result = controller.newOne(request);

    assertThat(result.status()).isEqualTo(OK);
    assertThat(contentAsString(result)).contains("New program");
    assertThat(contentAsString(result)).contains(CSRF.getToken(request.asScala()).value());
  }

  @Test
  public void create_returnsFormWithErrorMessage() {
    RequestBuilder requestBuilder =
        Helpers.fakeRequest().bodyForm(ImmutableMap.of("name", "", "description", ""));
    Request request = addCSRFToken(requestBuilder).build();

    Result result = controller.create(request);

    assertThat(result.status()).isEqualTo(OK);
    assertThat(contentAsString(result)).contains("A program URL is required");
    assertThat(contentAsString(result)).contains("New program");
    assertThat(contentAsString(result)).contains(CSRF.getToken(request.asScala()).value());
  }

  @Test
  public void create_returnsNewProgramInList() {
    RequestBuilder requestBuilder =
        addCSRFToken(
            Helpers.fakeRequest()
                .bodyForm(
                    ImmutableMap.of(
                        "adminName",
                        "internal-program-name",
                        "adminDescription",
                        "Internal program description",
                        "localizedDisplayName",
                        "External program name",
                        "localizedDisplayDescription",
                        "External program description",
                        "displayMode",
                        DisplayMode.PUBLIC.getValue())));

    Result result = controller.create(requestBuilder.build());

    assertThat(result.status()).isEqualTo(SEE_OTHER);
    assertThat(result.redirectLocation()).hasValue(routes.AdminProgramController.index().url());

    Result redirectResult = controller.index(addCSRFToken(Helpers.fakeRequest()).build());
    assertThat(contentAsString(redirectResult)).contains("External program name");
    assertThat(contentAsString(redirectResult)).contains("External program description");
  }

  @Test
  public void create_includesNewAndExistingProgramsInList() {
    ProgramBuilder.newActiveProgram("Existing One").build();
    RequestBuilder requestBuilder =
        addCSRFToken(
            Helpers.fakeRequest()
                .bodyForm(
                    ImmutableMap.of(
                        "adminName",
                        "internal-program-name",
                        "adminDescription",
                        "Internal program description",
                        "localizedDisplayName",
                        "External program name",
                        "localizedDisplayDescription",
                        "External program description",
                        "displayMode",
                        DisplayMode.PUBLIC.getValue())));

    Result result = controller.create(requestBuilder.build());

    assertThat(result.status()).isEqualTo(SEE_OTHER);
    assertThat(result.redirectLocation()).hasValue(routes.AdminProgramController.index().url());

    Result redirectResult = controller.index(addCSRFToken(Helpers.fakeRequest()).build());
    assertThat(contentAsString(redirectResult)).contains("Existing One");
    assertThat(contentAsString(redirectResult)).contains("External program name");
    assertThat(contentAsString(redirectResult)).contains("External program description");
  }

  @Test
  public void edit_withInvalidProgram_throwsProgramNotFoundException() {
    Request request = Helpers.fakeRequest().build();

    assertThatThrownBy(() -> controller.edit(request, 1L))
        .isInstanceOf(ProgramNotFoundException.class);
  }

  @Test
  public void edit_returnsExpectedForm() throws Exception {
    Request request = addCSRFToken(Helpers.fakeRequest()).build();
    Program program = ProgramBuilder.newDraftProgram("test program").build();

    Result result = controller.edit(request, program.id);

    assertThat(result.status()).isEqualTo(OK);
    assertThat(contentAsString(result)).contains("Edit program");
    assertThat(contentAsString(result)).contains("test program");
    assertThat(contentAsString(result)).contains(CSRF.getToken(request.asScala()).value());
  }

  @Test
  public void newVersionFrom_onlyActive_editActiveReturnsNewDraft() {
    // When there's a draft, editing the active one instead edits the existing draft.
    String programName = "test program";
    Request request = addCSRFToken(Helpers.fakeRequest()).build();
    Program activeProgram =
        ProgramBuilder.newActiveProgram(programName, "active description").build();

    Result result = controller.newVersionFrom(request, activeProgram.id);
    Optional<Program> newDraft = versionRepository.getDraftVersion().getProgramByName(programName);

    // A new draft is made and redirected to.
    assertThat(newDraft).isPresent();
    assertThat(newDraft.get().getProgramDefinition().adminDescription())
        .isEqualTo("active description");

    // Redirect is to the  draft.
    assertThat(result.status()).isEqualTo(SEE_OTHER);
    assertThat(result.redirectLocation())
        .hasValue(routes.AdminProgramController.edit(newDraft.get().id).url());
  }

  @Test
  public void newVersionFrom_withDraft_editActiveReturnsDraft() {
    // When there's a draft, editing the active one instead edits the existing draft.
    String programName = "test program";
    Request request = addCSRFToken(Helpers.fakeRequest()).build();
    Program activeProgram =
        ProgramBuilder.newActiveProgram(programName, "active description").build();
    Program draftProgram = ProgramBuilder.newDraftProgram(programName, "draft description").build();

    Result result = controller.newVersionFrom(request, activeProgram.id);

    // Redirect is to the existing draft.
    assertThat(result.status()).isEqualTo(SEE_OTHER);
    assertThat(result.redirectLocation())
        .hasValue(routes.AdminProgramController.edit(draftProgram.id).url());

    Program updatedDraft =
        programRepository.lookupProgram(draftProgram.id).toCompletableFuture().join().get();
    assertThat(updatedDraft.getProgramDefinition().adminDescription())
        .isEqualTo("draft description");
  }

  @Test
  public void update_invalidProgram_returnsNotFound() {
    Request request =
        Helpers.fakeRequest()
            .bodyForm(ImmutableMap.of("name", "name", "description", "description"))
            .build();

    assertThatThrownBy(() -> controller.update(request, 1L))
        .isInstanceOf(NotChangeableException.class);
  }

  @Test
  public void update_invalidInput_returnsFormWithErrors() throws Exception {
    Program program = ProgramBuilder.newDraftProgram("Existing One").build();
    Request request =
        addCSRFToken(Helpers.fakeRequest())
            .bodyForm(ImmutableMap.of("name", "", "description", ""))
            .build();

    Result result = controller.update(request, program.id);

    assertThat(result.status()).isEqualTo(OK);
    assertThat(contentAsString(result)).contains("Edit program");
    assertThat(contentAsString(result)).contains("A program note is required");
    assertThat(contentAsString(result)).contains(CSRF.getToken(request.asScala()).value());
  }

  @Test
  public void update_overwritesExistingProgram() throws Exception {
    Program program = ProgramBuilder.newDraftProgram("Existing One", "old description").build();
    RequestBuilder requestBuilder =
        Helpers.fakeRequest()
            .bodyForm(
                ImmutableMap.of(
                    "adminDescription",
                    "New internal program description",
                    "localizedDisplayName",
                    "New external program name",
                    "localizedDisplayDescription",
                    "New external program description",
                    "displayMode",
                    DisplayMode.PUBLIC.getValue()));

    Result result = controller.update(addCSRFToken(requestBuilder).build(), program.id);

    assertThat(result.status()).isEqualTo(SEE_OTHER);
    assertThat(result.redirectLocation()).hasValue(routes.AdminProgramController.index().url());

    Result redirectResult = controller.index(addCSRFToken(Helpers.fakeRequest()).build());
    assertThat(contentAsString(redirectResult))
        .contains(
            "Create new program", "New external program name", "New external program description");
    assertThat(contentAsString(redirectResult)).doesNotContain("Existing one", "old description");
  }
}
