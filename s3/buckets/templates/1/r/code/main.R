library(ggplot2)

args <- commandArgs(trailingOnly = TRUE)

# use an argument as a parameter for the sine function
cycles <- as.numeric(args[2])

# read some input data from a filename specified by an argument
points <- as.numeric(readLines(args[3]))

# sine function
x = seq(0, cycles * 2 * pi, length = points)
y = sin(x)

# plot to a PNG file (note the output directory)
png(filename = "../results/fig1.png", width = 5,
    height = 4, units = 'in', res = 300)
plot(x, y, type = "l")
title(args[1])
dev.off()

# alternatively, plot using ggplot (and save to PNG)
df <- data.frame(x = x, y = y)
p <- qplot(x, y, data = df) + geom_line() + ggtitle(args[1])

ggsave('../results/fig2.png', p)
