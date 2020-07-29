# Install and load ggplot2 R package
library(ggplot2)

# get command line arguments
args <- commandArgs(trailingOnly = TRUE)

# check the amount of arguments
if (length(args) >= 3) {
  plot_title <- args[1]
  number_of_cycles <- args[2]
  input_data <- args[3]
} else {
  plot_title <- "Hello Code Ocean"
  number_of_cycles <- 3
  input_data <- "../data/sample-data.txt"
}

# use an argument as a parameter for the sine function
cycles <- as.numeric(number_of_cycles)

# read some input data from a filename specified by an argument
points <- as.numeric(readLines(input_data))

# sine function
x = seq(0, cycles * 2 * pi, length = points)
y = sin(x)

# plot to a PNG file (note the output directory)
png(
  filename = "../results/fig1.png",
  width = 5,
  height = 4,
  units = 'in',
  res = 300
)
plot(x, y, type = "l")
title(plot_title)
dev.off()

# alternatively, plot using ggplot (and save to PNG)
df <- data.frame(x = x, y = y)
p <- qplot(x, y, data = df) + geom_line() + ggtitle(plot_title)
p

ggsave('../results/fig2.png', p)
