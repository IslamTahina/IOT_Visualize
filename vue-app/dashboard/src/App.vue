<script setup>
// Importing Arrow icons from Heroicons and Card component from PrimeVue
import { ArrowDownIcon } from "@heroicons/vue/24/solid";
import { ArrowUpIcon } from "@heroicons/vue/24/solid";
import Card from "primevue/card";

// Importing required modules from Socket.io and Vue
import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";
import {  ref, watch } from "vue";

// Initializing reactive Vue variables
let data = ref([]);
const devices = ref([]);

// Setting up a WebSocket connection to the server
const socket = io("ws://localhost:3000", {
  transports: ["websocket"],
  reconnectionDelayMax: 10000,
});

// Socket event listeners for connection and receiving data
socket.on("connect", () => {
  console.log("Connected");
});
socket.on("broadcast", (x) => {
  data.value = data.value.concat(x.data);
});

// Utility function to check if an IP address is local
function isLocalAddress(address) {
  const firstChunk = address.split(".")[0];
  if (["10", "192", "172"].includes(firstChunk)) {
    return true;
  }
  return false;
}

// Watching for changes in 'data' and updating 'devices' with local IPs
watch(
  data,
  (newData) => {
    console.log(newData);
    const ips = Array.from(
      new Set(
        newData
          .map((i) => [i.src, i.dst])
          .flat()
          .filter((i) => !!i)
      )
    );
    devices.value = ips.filter(isLocalAddress);
  },
  { immediate: true }
);

// Functions to calculate inbound and outbound data for each device
function getInBound(address) {
  return data.value.filter((i) => i.dst == address)?.length;
}
function getOutBound(address) {
  return data.value.filter((i) => i.src == address)?.length;
}

// Function to get the name of the device from its address
function getDeviceName(address) {
  const item = data.value.find((i) => i.src == address);
  return item.src_host;
}
</script>
<template>
  <div class="m-5">
    <h1 class="text-4xl">Local Connected Devices</h1>
    <div class="flex flex-wrap">
      <!-- Looping through each device and displaying its data -->
      <div v-for="device in devices" class="w-1/4">
        <Card class="m-3">
          <!-- Displaying the device name -->
          <template #title> {{ getDeviceName(device) }} </template>
          <!-- Displaying the inbound and outbound traffic counts -->
          <template #content>
            <p class="flex flex-wrap justify-between w-full">
              <div class="flex">
                <ArrowDownIcon class="h-8 w-8 text-red-600"></ArrowDownIcon>
                
                {{ getInBound(device) }}
              </div>
              <div class="flex">
                <ArrowUpIcon class="h-8 w-8 text-green-600"></ArrowUpIcon>
                {{ getOutBound(device) }}
              </div>
            </p>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style>
:root {
  background-color: antiquewhite;
}
</style>
