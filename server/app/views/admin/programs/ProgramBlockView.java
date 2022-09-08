package views.admin.programs;

import static j2html.TagCreator.div;

import j2html.tags.specialized.DivTag;
import services.program.ProgramDefinition;
import views.BaseHtmlView;


abstract class ProgramBlockView extends BaseHtmlView {
  /** Renders a div with internal/admin program information. */
  protected final DivTag renderProgramInfo(ProgramDefinition programDefinition) {
    DivTag programStatus =
        div("Draft").withId("program-status").withClasses("text-xs", "uppercase");
    DivTag programTitle =
        div(programDefinition.adminName())
            .withId("program-title")
            .withClasses("text-3xl", "pb-3");
    DivTag programDescription =
        div(programDefinition.adminDescription()).withClasses("text-sm");

    return div(programStatus, programTitle, programDescription)
        .withClasses(
            "bg-gray-100",
            "text-gray-800",
            "shadow-md",
            "p-8",
            "pt-4",
            "-mx-2");
  }
}
