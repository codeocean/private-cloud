if (open(my $ifh, '<:encoding(UTF-8)', $ARGV[0])) {
    my $data = <$ifh>;
    print "Hello $data";
    close $ifh;
    if (open(my $ofh, '>:encoding(UTF-8)', '../results/result.txt')) {
        print $ofh "Hello $data";
        close $ofh;
    }
}
