const value = process.env.DATABASE_URL ?? process.argv[2];

if (!value) {
  process.exit(0);
}

try {
  const url = new URL(value);
  url.searchParams.delete("schema");
  process.stdout.write(url.toString());
} catch {
  process.stdout.write(value);
}
