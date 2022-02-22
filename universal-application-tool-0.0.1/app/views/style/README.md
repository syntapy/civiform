# Intro

There are some constraints on what a developer can and cannot do with the Java code. Here's the backstory

We use Tailwind for CSS which has a builtin mechanism to trim unused styles out of the final CSS file.
This is designed to directly read HTML code.

However, since we use Java with J2html, Tailwind's builtin mechanism for this does not work on our setup.

Therefore in order to not have a massive 4M CSS file in prod we are parsing the Java code to identify 
which calls to style definition files (Styles.java, BaseStyles.java, and StyleUtils.java) are being made. 
This puts some minor constraints on what can and cannot be done in the Java code, effectively constraining 
the allowed Java to a subset of Java syntax.

Not to worry, this shouldn't be restrictive at all. Most constraints probably wouldn't be a problem anyways
but its good to list them out just to be safe, since a problem might cause some styles to silently not
appear in the final CSS file.

## File locations

The final CSS file is `/universal-application-tool-0.0.1/public/stylesheets/tailwind.css`.

It is produced by the config in `/universal-application-tool-0.0.1/tailwind.config.js` where our Java parsing
process happens.

You can refresh the styles by running `./bin/refresh-styles` or restarting the server

# The constraints

Constraints apply in both the style definition .java files (Styles.java, BaseStyles.java) and all .java files that use them.

## Constraints in style definition files

- *Fields in BaseStyles.java which are assigned to string literal cannot appear in Styles.java, and visa versa.* Otherwise 
	this would (silently) confuse the dictionary of styles, resulting in missing styles. Refactoring the parsing code to 
	remove this constraint, however, wouldn't be hard
- *Those fields in any styles definition files which are assigned with string literals can only have uppercase letters, 
	numbers, and underscores.* In other words, they should match the /[0-9A-Z_]+/ regular expression, otherwise they will not 
	show up in the final CSS style file, unless you modify the constraints found in /univesal-application-tool-0.0.1/css_trim/*.js

## Constraints in other java files

As implementing the parsing routines is a WIP, some constraints have not shown up yet. However, at the moment, any calls
to styles files outside of the app/views/ package will not show up in the final CSS file as currently configured
