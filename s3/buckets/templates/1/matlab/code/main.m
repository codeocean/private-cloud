function main(plotTitle, numberOfCycles, inputData)
  % read some input data from inputData (a filename argument)
  points = str2num(fileread(inputData));

  % use numberOfCycles (an integer argument) as a parameter for the sine function
  x = linspace(0, numberOfCycles * 2 * pi, points);
  y = sin(x);

  % plot the function using plotTitle (a string argument) as the title
  plot(x, y, 'r');
  title(plotTitle);
  xlabel('x');
  ylabel('y');
  grid on;

  % finally, save the resulting plot to a PNG file (note the output directory)
  saveas(gcf, '../results/plot.png');
end
