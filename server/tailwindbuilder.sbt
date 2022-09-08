import scala.sys.process.Process
import sbt.internal.io.{Source, WatchState}
import sbt.io.syntax._

lazy val tailwindCli =
  TaskKey[Unit]("run tailwindCLI when packaging the application")

def runTailwindCli(file: File) = {
  Process(
    "npx tailwindcss build -i ./app/assets/stylesheets/styles.css -o ./public/stylesheets/tailwind.css",
    //"ls",
    file
  ) !
}

tailwindCli := {
  if (runTailwindCli(baseDirectory.value) != 0)
    throw new Exception("Something went wrong when running tailwind.")
}

dist := (dist dependsOn tailwindCli).value
stage := (stage dependsOn tailwindCli).value
test := (Test / test dependsOn tailwindCli).value
//Runtime / products := (Runtime / products dependsOn tailwindCli).value
//Compile / products := (Compile / products dependsOn tailwindCli).value
//Test / products := (Test / products dependsOn tailwindCli).value
//Compile / package := (Compile / package dependsOn tailwindCli).value
//Compile / exportedProducts := (Compile / exportedProducts dependsOn tailwindCli).value
//Compile / bspBuildTargetCompileItem := (Compile / bspBuildTargetCompileItem dependsOn tailwindCli).value
