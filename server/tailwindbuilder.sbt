import scala.sys.process.Process
import sbt.internal.io.{Source, WatchState}
import sbt.io.syntax._

lazy val tailwindCli =
  TaskKey[Unit]("run tailwindCLI when packaging the application")

// with ls it runs 2x on startup and 2x on file change

def runTailwindCli(file: File) = {
  Process(
    "npx tailwindcss build -i ./app/assets/stylesheets/styles.css -o ./public/stylesheets/tailwind.css",
    //"cp -f 'node_modules/tailwindcss/dist/tailwind.css public/stylesheets/tailwind.css'; ls",
    //"sh -c 'touch public/stylesheets/tailwind.css; ls -l public/stylesheets/'",
    //"bash -c 'ls -l;echo hello'",// public/stylesheets/",
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

// can load sbt file, but does not rebuild styles
Compile / run := (Compile / run dependsOn tailwindCli).evaluated

// cannot load sbt file
//ThisBuild / run := (ThisBuild / run dependsOn tailwindCli).evaluated

// can load sbt file, but loops
//Runtime / compile := (Runtime / compile dependsOn tailwindCli).value

// cannot load sbt
//compile := (compile dependsOn tailwindCli).value

// cannot load sbt
//run / compile := (run / compile dependsOn tailwindCli).value

// compileOutputs not found
//Compile / compileOutputs / changedOutputFiles := (Compile / compileOutputs / changedOutputFiles).dependsOn(tailwindCli).value

//Compile / compile := (Compile / compile dependsOn tailwindCli).value

//Compile / twirlCompileTemplates := (Compile / twirlCompileTemplates dependsOn tailwindCli).value

// RUNS, but not sure if works
//Compile / run := (Compile / run dependsOn tailwindCli).inputTaskValue.evaluated

//Compile / run := (Compile / run dependsOn tailwindCli).evaluated
//Compile / twirlCompileTemplates := (Compile / twirlCompileTemplates dependsOn tailwindCli).value

//Compile / compile := (Compile / compile dependsOn tailwindCli).value
//Runtime / pickleProducts := (Runtime / pickleProducts dependsOn tailwindCli).value
//Compile / allOutputFiles := (Compile / allOutputFiles dependsOn tailwindCli).value
//Runtime / dependencyClasspathFiles / allOutputFiles := (Runtime / dependencyClasspathFiles / allOutputFiles dependsOn tailwindCli).value

// Says 'error: not found: value outputFiles'
//run / compileOutputs / allOutputFiles := (run / compileOutputs / allOutputFiles dependsOn tailwindCli).value
