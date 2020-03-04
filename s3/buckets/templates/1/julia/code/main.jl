using PyPlot

# read some input data from a filename specified by an argument
f = open(ARGS[3], "r")
points = parse(Int, read(f, String))
close(f)

# use a provided argument as a parameter for the sine function
cycles = parse(Int, ARGS[2])
x = range(0, cycles * 2π, length=points)
y = sin.(x)

# plot the function
plot(x, y)
xlabel("x")
ylabel("y")
title(ARGS[1])

savefig("../results/fig1.png")
