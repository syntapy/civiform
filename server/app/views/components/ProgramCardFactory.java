package views.components;

import static com.google.common.base.Preconditions.checkNotNull;
import static j2html.TagCreator.div;
import static j2html.TagCreator.p;
import static j2html.TagCreator.span;

import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;
import j2html.tags.specialized.ButtonTag;
import j2html.tags.specialized.DivTag;
import java.time.Instant;
import java.util.Optional;
import javax.inject.Inject;
import services.DateConverter;
import services.program.ProgramDefinition;
import views.ViewUtils;
import views.style.AdminStyles;
import views.style.BaseStyles;
import views.style.ReferenceClasses;
import views.style.StyleUtils;
import views.style.Styles;

/** Responsible for generating a program card for view by CiviForm admins / program admins. */
public final class ProgramCardFactory {

  private final DateConverter dateConverter;

  @Inject
  public ProgramCardFactory(DateConverter dateConverter) {
    this.dateConverter = checkNotNull(dateConverter);
  }

  public DivTag renderCard(ProgramCardData cardData) {
    ProgramDefinition displayProgram = getDisplayProgram(cardData);

    String programTitleText = displayProgram.adminName();
    String programDescriptionText = displayProgram.adminDescription();

    DivTag statusDiv = div();
    if (cardData.draftProgram().isPresent()) {
      statusDiv =
          statusDiv.with(renderProgramRow(/* isActive = */ false, cardData.draftProgram().get()));
    }

    if (cardData.activeProgram().isPresent()) {
      statusDiv =
          statusDiv.with(
              renderProgramRow(
                  /* isActive = */ true,
                  cardData.activeProgram().get(),
                  cardData.draftProgram().isPresent() ? "border-t" : ""));
    }

    DivTag titleAndStatus =
        div()
            .withClass("flex")
            .with(
                p(programTitleText)
                    .withClasses(
                        ReferenceClasses.ADMIN_PROGRAM_CARD_TITLE,
                        "w-1/4",
                        "py-7",
                        "text-black",
                        "font-bold",
                        "text-xl"),
                statusDiv.withClasses(
                    "flex-grow",
                    "text-sm",
                    StyleUtils.responsiveLarge("text-base")));

    return div()
        .withClasses(
            ReferenceClasses.ADMIN_PROGRAM_CARD,
            "w-full",
            "my-4",
            "pl-6",
            "border",
            "border-gray-300",
            "rounded-lg")
        .with(
            titleAndStatus,
            p(programDescriptionText)
                .withClasses(
                    "w-3/4",
                    "mb-8",
                    "pt-4",
                    "line-clamp-3",
                    "text-gray-700",
                    "text-base"))
        // Add data attributes used for client-side sorting.
        .withData("last-updated-millis", Long.toString(extractLastUpdated(cardData).toEpochMilli()))
        .withData("name", programTitleText);
  }

  private DivTag renderProgramRow(
      boolean isActive, ProgramCardData.ProgramRow programRow, String... extraStyles) {
    ProgramDefinition program = programRow.program();
    String badgeText = "Draft";
    String badgeBGColor = BaseStyles.BG_CIVIFORM_PURPLE_LIGHT;
    String badgeFillColor = BaseStyles.TEXT_CIVIFORM_PURPLE;
    String updatedPrefix = "Edited on ";
    Optional<Instant> updatedTime = program.lastModifiedTime();
    if (isActive) {
      badgeText = "Active";
      badgeBGColor = BaseStyles.BG_CIVIFORM_GREEN_LIGHT;
      badgeFillColor = BaseStyles.TEXT_CIVIFORM_GREEN;
      updatedPrefix = "Published on ";
    }

    String formattedUpdateTime =
        updatedTime.map(t -> dateConverter.renderDateTime(t)).orElse("unknown");
    String formattedUpdateDate =
        updatedTime.map(t -> dateConverter.renderDate(t)).orElse("unknown");

    int blockCount = program.getBlockCount();
    int questionCount = program.getQuestionCount();

    String extraActionsButtonId = "extra-actions-" + program.id();
    ButtonTag extraActionsButton =
        ViewUtils.makeSvgTextButton("", Icons.MORE_VERT)
            .withId(extraActionsButtonId)
            .withClasses(
                AdminStyles.TERTIARY_BUTTON_STYLES,
                ReferenceClasses.WITH_DROPDOWN,
                "h-12",
                programRow.extraRowActions().size() == 0 ? "invisible" : "");

    return div()
        .withClasses(
            "py-7",
            "flex",
            "flex-row",
            StyleUtils.hover("bg-gray-100"),
            StyleUtils.joinStyles(extraStyles))
        .with(
            p().withClasses(
                    badgeBGColor,
                    badgeFillColor,
                    "ml-2",
                    StyleUtils.responsiveXLarge("ml-8"),
                    "font-medium",
                    "rounded-full",
                    "flex",
                    "flex-row",
                    "gap-x-2",
                    "place-items-center",
                    "justify-center")
                .withStyle("min-width:90px")
                .with(
                    Icons.svg(Icons.NOISE_CONTROL_OFF)
                        .withClasses("inline-block", "ml-3.5"),
                    span(badgeText).withClass("mr-4")),
            div()
                .withClasses("ml-4", StyleUtils.responsiveXLarge("ml-10"))
                .with(
                    p().with(
                            span(updatedPrefix),
                            span(formattedUpdateTime)
                                .withClasses(
                                    "font-semibold",
                                    "hidden",
                                    StyleUtils.responsiveLarge("inline")),
                            span(formattedUpdateDate)
                                .withClasses(
                                    "font-semibold",
                                    StyleUtils.responsiveLarge("hidden"))),
                    p().with(
                            span(String.format("%d", blockCount)).withClass("font-semibold"),
                            span(blockCount == 1 ? " screen, " : " screens, "),
                            span(String.format("%d", questionCount))
                                .withClass("font-semibold"),
                            span(questionCount == 1 ? " question" : " questions"))),
            div().withClass("flex-grow"),
            div()
                .withClasses("flex", "space-x-2", "pr-6", "font-medium")
                .with(programRow.rowActions())
                .with(
                    div()
                        .withClass("relative")
                        .with(
                            extraActionsButton,
                            div()
                                .withId(extraActionsButtonId + "-dropdown")
                                .withClasses(
                                    "hidden",
                                    "flex",
                                    "flex-col",
                                    "border",
                                    "bg-white",
                                    "absolute",
                                    "right-0",
                                    "w-56",
                                    "z-50")
                                .with(programRow.extraRowActions()))));
  }

  private ProgramDefinition getDisplayProgram(ProgramCardData cardData) {
    if (cardData.draftProgram().isPresent()) {
      return cardData.draftProgram().get().program();
    }
    return cardData.activeProgram().get().program();
  }

  private static Instant extractLastUpdated(ProgramCardData cardData) {
    // Prefer when the draft was last updated, since active versions should be immutable after
    // being published.
    if (cardData.draftProgram().isEmpty() && cardData.activeProgram().isEmpty()) {
      throw new IllegalArgumentException("Program neither active nor draft.");
    }

    ProgramDefinition program =
        cardData.draftProgram().isPresent()
            ? cardData.draftProgram().get().program()
            : cardData.activeProgram().get().program();
    return program.lastModifiedTime().orElse(Instant.EPOCH);
  }

  @AutoValue
  public abstract static class ProgramCardData {
    abstract Optional<ProgramRow> activeProgram();

    abstract Optional<ProgramRow> draftProgram();

    public static Builder builder() {
      return new AutoValue_ProgramCardFactory_ProgramCardData.Builder();
    }

    @AutoValue.Builder
    public abstract static class Builder {
      public abstract Builder setActiveProgram(Optional<ProgramRow> v);

      public abstract Builder setDraftProgram(Optional<ProgramRow> v);

      public abstract ProgramCardData build();
    }

    @AutoValue
    public abstract static class ProgramRow {
      abstract ProgramDefinition program();

      abstract ImmutableList<ButtonTag> rowActions();

      abstract ImmutableList<ButtonTag> extraRowActions();

      public static Builder builder() {
        return new AutoValue_ProgramCardFactory_ProgramCardData_ProgramRow.Builder();
      }

      @AutoValue.Builder
      public abstract static class Builder {
        public abstract Builder setProgram(ProgramDefinition v);

        public abstract Builder setRowActions(ImmutableList<ButtonTag> v);

        public abstract Builder setExtraRowActions(ImmutableList<ButtonTag> v);

        public abstract ProgramRow build();
      }
    }
  }
}
