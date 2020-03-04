/** Iris Analysis **/

use "../data/iris.dta", clear
reg seplen sepwid
graph twoway (scatter seplen sepwid) (lfit seplen sepwid)
graph export ../results/iris_plot.eps, replace

/** Auto Analysis **/

sysuse auto, clear
replace price = price / 1000
eststo: quietly regress price weight mpg
sum *
reg price mpg rep78, robust
outreg2 using ../results/myreg.tex, replace ctitle(Model 1)
