#include <stdio.h>

int main(int argc, char *argv[])
{
    char data[64];
    FILE *infile, *outfile;

    if (argc < 2)
        return -1;

    infile = fopen(argv[1], "r");
    if (infile == NULL)
        return -1;

    if (fgets(data, sizeof(data), infile) != NULL)
        printf("Hello %s", data);

    fclose(infile);

    outfile = fopen("../results/result.txt", "w");
    fprintf(outfile, "Hello %s", data);
    fclose(outfile);

    return 0;
}
