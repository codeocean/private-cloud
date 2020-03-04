try:
    import sys
    import matplotlib.pyplot as plt
    from numpy import linspace, pi, sin

    # use the first argument as a parameter for the sine function
    cycles = int(sys.argv[2])

    # read some input data from a file provided as an argument
    with open(sys.argv[3], 'r') as f:
        points = int(f.read())

    # plot the sine function
    x = linspace(0, cycles * 2 * pi, points)
    y = sin(x)

    fig = plt.figure()
    plt.plot(x, y)
    plt.xlabel("x")
    plt.ylabel("y")
    plt.title(sys.argv[1])

    # finally, save the resulting plot to a PNG file (note the output directory)
    plt.savefig('../results/fig1.png')

except ImportError:
    with open('../results/result.txt', 'w') as f:
        f.write('Hello, World!')
    print('To generate a result figure, please install `matplotlib` via conda. See README.md for more details.')
