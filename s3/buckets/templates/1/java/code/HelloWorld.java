import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.io.PrintWriter;
import java.util.List;

public class HelloWorld {
	public static void main(String []args) throws java.io.IOException {
		if (args.length > 0) {
			List<String> lines = Files.readAllLines(Paths.get(args[0]), Charset.defaultCharset());
			String result = String.format("Hello %s!", lines.get(0));

			System.out.println(result);

			try (PrintWriter out = new PrintWriter("../results/result.txt" )) {
				out.println(result);
			}
		}
	}
}
