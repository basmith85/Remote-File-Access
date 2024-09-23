## HTTP File System Server

This project implements an HTTP server using Node.js that allows remote access to a file system. The server supports the following HTTP methods:

- **GET**: Retrieve files or list directory contents.
- **PUT**: Create or overwrite files.
- **DELETE**: Remove files or directories.
- **MKCOL**: Create new directories.

### Features

- Handles basic file operations with appropriate HTTP responses.
- Provides error handling for unsupported methods and missing files.
- Easy to test using command-line tools like `curl`.

### Usage

1. Start the server on port 8000.
2. Use a web browser or command-line tools to interact with the server.

#### Example Commands:

- `GET /`: Retrieve contents of the root directory.
- `PUT /example.txt`: Create or overwrite `example.txt`.
- `DELETE /example.txt`: Delete `example.txt`.
- `MKCOL /newdir`: Create a new directory named `newdir`.

### Testing

You can test the server using commands like:

```bash
curl http://localhost:8000/file.txt
curl -X PUT -d "Hello, World!" http://localhost:8000/file.txt
curl -X DELETE http://localhost:8000/file.txt
curl -X MKCOL http://localhost:8000/newdir
