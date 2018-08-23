// mapbox gl init
//mapboxgl.accessToken = 'pk.eyJ1IjoidW5lcGdyaWQiLCJhIjoiY2lzZnowenUwMDAzdjJubzZyZ3R1bjIzZyJ9.uyP-RWjY-94qCVajU0u8KA';
//var map = new mapboxgl.Map({
//    container: 'map',
//    style: 'mapbox://styles/mapbox/dark-v9',
//    center: [-14.66,-23.64],
//    zoom: 3
//});

// object to hold geojson
var data = {};

// test if file api is available
if (window.File && window.FileReader && window.FileList && window.Blob) {


    // handle read geojson
    // Update progress
    var updateProgress = function(theFile) {
        return function(e) {
            // evt is an ProgressEvent. 100/2 as loading is ~ half the process
            if (e.lengthComputable) {
                var percentLoaded = Math.round((e.loaded / e.total) * 50);
                progressScreen(
                    true,
                    theFile.name,
                    percentLoaded,
                    theFile.name + " loading (" + percentLoaded + "%)"
                );
            }
        };
    };
    // init progress bar
    var startProgress = function(theFile) {
        return function(e) {
            progressScreen(
                true,
                theFile.name,
                0,
                theFile.name + " init .. "
            );
        };
    };
    // on error, set progress to 100 (remove it)
    var errorProgress = function(theFile) {
        return function(e) {
            progressScreen(
                true,
                theFile.name,
                100,
                theFile.name + "stop .. "
            );
        };
    };

    // handle worker
    var startWorker = function(theFile) {
        return function(e) {
            // Create a worker to handle this file
            var w = new Worker("handleReadJson.js");

            // parse file content before passing to worker.
            var gJson = JSON.parse(e.target.result);

            // Message to pass to the worker
            var res = {
                json: gJson,
                fileName: theFile.name
            };

            // handle message received
            w.onmessage = function(e) {
                var m = e.data;
                if ( m.progress ) {
                    progressScreen(
                        true,
                        theFile.name,
                        m.progress,
                        theFile.name + ": " + m.message
                    );
                }

               // send alert for errors message
                if( m.errorMessage ){
                  alert(m.errorMessage);
                }

                // If extent is received
                if (m.extent) {
                    map.fitBounds(m.extent);
                }

                // If layer is valid and returned
                if (m.layer) {
                  try {
                    progressScreen(
                        true,
                        theFile.name,
                        100,
                        theFile.name + " done"
                    );
                    // add source to map
                    map.addSource(m.id, {
                        "type": "geojson",
                        "data": gJson
                    });
                    // add layer
                    map.addLayer(m.layer,"place-village");
                    // set progress to max
                    data[m.id] = gJson;
                  }
                  catch(err){
                    alert(err);
                  }
                  // close worker
                   w.terminate();
                }

            };

            // launch process
            try {
            w.postMessage(res);
            }catch(err){
              alert("An error occured, quick ! check the console !");
              console.log({
                res : res,
                err : err
              });
            }
        };
    };

    var updateLayerList = function(theFile) {
        return function(e) {};
    };
    // handle drop event
    var handleDropGeojson = function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        var files = evt.dataTransfer.files;

        var nFiles = files.length;
        var incFile = 100 / nFiles;
        var progressBar = 0;

        // In case of multiple file, loop on them
        for (var i = 0; i < nFiles; i++) {

            f = files[i];

            // Only process geojson files. Validate later.
            if (f.name.toLowerCase().indexOf(".geojson") == -1) {
                alert(f.name + " not supported");
                continue;
            }
            // get a new reader
            var reader = new FileReader();
            // handle events
            reader.onloadstart = (startProgress)(f);
            reader.onprogress = (updateProgress)(f);
            reader.onerror = (errorProgress)(f);
            reader.onload = (startWorker)(f);
            reader.onloadend = (updateLayerList)(f);
            // read the geojson
            reader.readAsText(f);
        }
    };
    var handleDragOver = function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    };

    // Set events
    mapEl = document.getElementById("map");
    mapEl.addEventListener('dragover', handleDragOver, false);
    mapEl.addEventListener('drop', handleDropGeojson, false);


} else {
    alert('The File APIs are not fully supported in this browser.');
}
