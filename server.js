/*
    Description: create an HTTP server with JS Node.js that allows remote access to a file system. The server allows web
    applications to read files using GET method, write files using PUT method, delete files using DELETE method, and create
    collections using MKCOL method.
*/


const { createServer } = require("http");
const { stat, readdir, writeFile, mkdir, rmdir, unlink } = require("fs").promises;
const mime = require("mime");
const { createReadStream } = require("fs"); // Import required modules
const { pipeline } = require("stream");
const { promisify } = require("util");

const methods = Object.create(null); // Create an object to define HTTP methods

const server = createServer((request, response) => {
  let handler = methods[request.method] || notAllowed; // Determine the appropriate request handler based on the HTTP method
  handler(request)
    .catch(error => {
      if (error.status != null) return error; // Return HTTP response with status if an error occurs
      return { body: String(error), status: 500 }; // Return a generic error response
    })
    .then(({ body, status = 200, type = "text/plain" }) => {
      response.writeHead(status, { "Content-Type": type }); // Set the HTTP response headers
      if (body && body.pipe) { // If the response body is a readable stream
        pipeline(body, response, err => {
          if (err) console.error("Pipeline failed", err); // Handle errors in the data pipeline
        });
      } else {
        response.end(body); // Send the response body
      }
    });
});

server.listen(8000, () => {
  console.log("Server is listening on port 8000"); // Start the HTTP server and listen on port 8000
});

async function notAllowed(request) {
  return {
    status: 405,
    body: `Method ${request.method} not allowed.` // Handle invalid HTTP methods
  };
}

function urlPath(url) {
  let path = new URL(url, "http://localhost:8000").pathname; // Extract and decode the URL path
  return `.${decodeURIComponent(path)}`;
}

methods.GET = async function (request) {
  let path = urlPath(request.url);
  let stats;
  try {
    stats = await stat(path); // Check if the requested file or directory exists
  } catch (error) {
    if (error.code != "ENOENT") throw error; // Handle file system errors
    else return { status: 404, body: "File not found" }; // Return a 404 response if the resource doesn't exist
  }
  if (stats.isDirectory()) {
    return { body: (await readdir(path)).join("\n") }; // Read and return the directory contents
  } else {
    return { body: createReadStream(path), type: mime.getType(path) }; // Read and return the file content with the appropriate MIME type
  }
};

methods.PUT = async function (request) {
  let path = urlPath(request.url);

  // Read the request data and write it to the file
  let data = [];
  for await (const chunk of request) {
    data.push(chunk);
  }

  await writeFile(path, Buffer.concat(data)); // Write the received data to the file

  return { status: 204 }; // Return a 204 (No Content) response to indicate success
};

methods.DELETE = async function (request) {
  let path = urlPath(request.url);
  let stats;
  try {
    stats = await stat(path); // Check if the resource exists
  } catch (error) {
    if (error.code != "ENOENT") throw error; // Handle file system errors
    else return { status: 204 }; // Return a 204 response if the resource doesn't exist (considered deleted)
  }
  if (stats.isDirectory()) await rmdir(path); // Delete a directory
  else await unlink(path); // Delete a file
  return { status: 204 }; // Return a 204 (No Content) response to indicate success
};

methods.MKCOL = async function (request) {
  let path = urlPath(request.url);
  await mkdir(path); // Create a new directory
  return { status: 204 }; // Return a 204 (No Content) response to indicate success
};

methods.invalid = async function (request) {
  return {
    status: 405,
    body: `The method ${request.method} is not supported.` // Handle invalid HTTP methods
  };
};

const pipeStream = promisify(pipeline);


/*
https://replit.com/join/txzpqgaasa-fallentiger101
To test this server, you can use a web browser to access it at http://localhost:8000. You can use the following commands to test all the uses of the server:

GET / - Get the contents of the root directory. 
PUT /example.txt - Write the contents of the example.txt file.
DELETE /example.txt - Delete the example.txt file.
MKCOL /newdir - Create a new directory named newdir.
To test:

1. curl http://localhost:8000/file.txt
This will use GET and give no output as the file has not been created yet.
2. curl -X PUT -d "Hello, World!" http://localhost:8000/file.txt
PUT creates a file named file.txt with the contents "Hello, World!".
3. curl -X DELETE http://localhost:8000/file.txt
DELETE deletes the file.txt file.
4. curl -X MKCOL http://localhost:8000/newdir
MKCOL creates a new directory named newdir.
5. Error Handling:
curl -X POST http://localhost:8000/file.txt
This will return a 405 error as POST is not supported.
*/
