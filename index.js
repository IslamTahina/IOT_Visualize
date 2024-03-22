// Importing necessary modules
import { createServer } from "http";
import { Server } from "socket.io";
import { spawn, exec } from "child_process";
import { readFileSync, watch } from "fs";

// Function to capture 1000 packets using tcpdump and convert them to JSON format
function get1000Packets() {
  // Using tcpdump to capture packets and writing them to a pcap file
  const packets1000 = spawn("tcpdump", [
    "-i",
    "en0", // Interface name
    "-c",
    "1000", // Number of packets to capture
    "-W",
    "1", // File rotation
    "-C",
    "10", // File size for rotation
    "-w",
    "./test.pcap", // Output file
  ]);

  // On completing the packet capture
  packets1000.on("close", () => {
    // Executing tshark to convert pcap to JSON format
    const formatter = exec("tshark -r ./test.pcap -T json > ./log.json");
    formatter.on("close", () => {
      // Recursive call to continue capturing packets
      get1000Packets();
    });
  });
}

// Initiate packet capturing
get1000Packets();

// Creating an HTTP server for socket communication
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

// Function to extract IP information from each packet
function getIpInfo(packet) {
  return {
    src: packet?._source?.layers?.ip?.["ip.src"],
    src_host: packet?._source?.layers?.ip?.["ip.src_host"],
    dst_host: packet?._source?.layers?.ip?.["ip.dst_host"],
    dst: packet?._source?.layers?.ip?.["ip.dst"],
  };
}

// Function to read and format packet data from JSON file
function getFormattedPackets() {
  let fileContent = readFileSync("./log.json", "utf-8");
  let json = [];
  try {
    json = JSON.parse(fileContent);
  } catch (e) {
    json = [];
  }

  json = json.map(getIpInfo);

  return json;
}

// Setting up socket.io connection
io.on("connection", (socket) => {
  // Emitting initial packet data to all clients
  io.sockets.emit("broadcast", { data: getFormattedPackets() });

  // Debouncing function to limit the rate of broadcast updates
  const debouncer = debounce(() => {
    io.sockets.emit("broadcast", { data: getFormattedPackets() });
  }, 1000);

  // Watching for changes in the log file and emitting updates
  const watcher = watch("./log.json", (e, f) => {
    debouncer();
  });

  // Closing the file watcher when socket connection is closed
  socket.conn.on("close", () => {
    watcher.close();
  });
});

// Listening for connections on port 3000
io.listen(3000);

// Debounce function to limit the frequency of function calls
function debounce(func, wait) {
  let timeout;
  return function excutedFunction() {
    const later = () => {
      clearTimeout(timeout);
      func();
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
