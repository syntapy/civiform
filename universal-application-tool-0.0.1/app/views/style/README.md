# Intro

There is one constraint on what a developer can do when working with styles

## The backstory

We use Tailwind for CSS which has a builtin mechanism to trim unused styles out of the final CSS file.

Since we use Java with J2html, Tailwind's builtin mechanism for trimming out unused styles does not work on our setup.

Therefore we are doing that ourselves, trimming out a massive 4M CSS file and reducing it to a couple dozen Kb
by parsing our code for calls to styles in style definition files.

This puts one constraint on how you can use methods in `StyleUtils.java`

- *When calling any public method from the `StyleUtils` class except for `joinStyles(..)`, the argument(s) to that method 
  must be a direct call to a field in (Styles.java or ReferenceClasses.java). 
	For example you can call `StyleUtils.responsiveMedium(Styles.MT_5, Styles.MB_2)` for any number of arguments, but you cannot do 
	`StyleUtils.responsiveMedium(BaseStyles.XYZ)`, or passing `Styles.XYZ` value as a variable* 

Also, if not obvious already, *fields in any styles definition files which are assigned with string literals can only have uppercase letters, 
	numbers, and underscores.* In other words, they should match the /[0-9A-Z_]+/ regular expression, otherwise they will not 
	show up in the final CSS style file without modifying the constraints found in `/universal-application-tool-0.0.1/css_trim/*.js`


## TODO

Mention where prefixes are. To be done after they actually get moved to a config file

## Files and locations

Style definition files are `Styles.java` and `BaseStyles.java` in `/universal-application-tool-0.0.1/app/views/style/`

`StyeUtils.java`, in same folder, is used for media queries

The final CSS file is `/universal-application-tool-0.0.1/public/stylesheets/tailwind.css`.

It is produced by the config in `/universal-application-tool-0.0.1/tailwind.config.js` where our Java parsing
process happens.

You can refresh the styles by running `./bin/refresh-styles` or restarting the server. This needs to happen every time 
you make a change to which styles are being called in the code
