import play.sbt.PlayRunHook
import sbt.File

import scala.sys.process.Process

object TailwindBuilder {
  def apply(base: File): PlayRunHook = {
    object TailwindBuilderHook extends PlayRunHook {
      var process: Option[Process] = None
      var watchProcess: Option[Process] = None

      override def beforeStarted() = {
        process = Option(
          Process(
            "npx tailwindcss build -i ./app/assets/stylesheets/styles.css -o ./public/stylesheets/tailwind.css",
            base
          ).run()
        )
      }

      override def afterStarted() = {
        watchProcess = Option(
          Process(
            "npx tailwindcss build -i ./app/assets/stylesheets/styles.css -o ./public/stylesheets/tailwind.css --watch",
            base
          ).run()
        )
      }

      override def afterStopped() = {
        process.foreach(_.destroy())
        watchProcess.foreach(_.destroy())
        process = None
      }
    }

    TailwindBuilderHook
  }
}
