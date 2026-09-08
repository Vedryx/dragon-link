# Design source

`Dragon Link.dc.html` is the Claude Design source this site was built from
([project](https://claude.ai/design/p/24992634-97d1-46ad-a7a0-48352b9b5b25)).
It is kept here as the reference for what the page is meant to look like; it is
not part of the build.

It is a `<x-dc>` template — the design canvas runtime compiles the `{{ }}`
bindings, `sc-for`, `sc-if` and `style-hover` attributes into React at page
load, pulling React and Babel from unpkg. `src/` is that same page, compiled
ahead of time instead. When the design changes, diff it against this file and
port the change into `src/`.
