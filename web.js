'use strict'

var canvas;
var context;
var x, y;
var ratio;
var fftSize = 1024;
var audioContext = new AudioContext();
var AnaliserNode = audioContext.createAnalyser();
AnaliserNode.fftSize = fftSize;
var bufferLength = AnaliserNode.frequencyBinCount;
var frequency = new Uint8Array(bufferLength);
var AnaliserNode2 = audioContext.createAnalyser();
AnaliserNode2.fftSize = fftSize;
var bufferLength2 = AnaliserNode2.frequencyBinCount;
var frequency2 = new Uint8Array(bufferLength2);
var source = audioContext.createBufferSource();

request.onload = onload;

function onload() {
    var res = request.response;

    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    audioContext.decodeAudioData(res, function (buf) {
        source.buffer = buf;
        navigator.mediaDevices.getUserMedia({
            audio: true
        }).then(function (stream) {
            audioContext.destination.channelCount = 2;
            var source = audioContext.createMediaStreamSource(stream);
            var gainNode = audioContext.createGain();
            var splitterR = audioContext.createChannelSplitter(2);
            var splitterL = audioContext.createChannelSplitter(2);
            var merger = audioContext.createChannelMerger(2);
            var scriptNode = audioContext.createScriptProcessor(1024, 1, 1);
            scriptNode.onaudioprocess = process;
            var filter = audioContext.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.value = 500;
            filter.gain.value = 25;
            gainNode.gain.value = 1;
            source.connect(splitterL);
            source.connect(splitterR);
            splitterR.connect(merger, 0, 0);
            splitterL.connect(merger, 0, 1);
            merger.connect(gainNode);
            gainNode.connect(filter);
            filter.connect(scriptNode);
            scriptNode.connect(audioContext.destination);
            //source.connect(AnaliserNode2);
            scriptNode.connect(AnaliserNode);
        });
        requestAnimationFrame(animate);
    });
};

function animate(timestamp) {
    context.clearRect(0, 0, 600, 480);
    // AnaliserNode.getByteFrequencyData(frequency);
    // AnaliserNode2.getByteFrequencyData(frequency2);
    AnaliserNode.getByteTimeDomainData(frequency2);
    //AnaliserNode.getByteTimeDomainData(frequency);
    AnaliserNode.getByteFrequencyData(frequency);
    for (var i = 0; i < 512; i++) {
        context.strokeStyle = 'rgba(0,0,255,255)';
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, frequency[i]);
        context.stroke();
    }
    for (var i = 0; i < 512; i++) {
        context.strokeStyle = 'rgba(255,0,135,64)';
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, frequency2[i]);
        context.stroke();
    }
    requestAnimationFrame(animate);
}

function process(audioProcessingEvent) {
    var inputBuffer = audioProcessingEvent.inputBuffer;
    var outputBuffer = audioProcessingEvent.outputBuffer;
    for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        var inputData = inputBuffer.getChannelData(channel);
        var outputData = outputBuffer.getChannelData(channel);
        for (var sample = 0; sample < inputBuffer.length; sample += 20) {
            for (let i = 0; i < 20; i++) {
                outputData[sample + i] = inputData[sample];
                if (outputData[sample + i] > 0.1) {
                    console.log(outputData[sample + i]);
                    outputData[sample + i] = 0.1;
                }
            }

            // add noise to each output sample
            // outputData[sample] += ((Math.random() * 2) - 1) * 0.2;         
        }
    }
}