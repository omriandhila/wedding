var fs = require('fs');
var path = require('path')

var dirPath = 'img/local'; 
var output = {
	data: []
};

function getFiles (dir, files_){
    files_ = files_ || [];
    
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        var fileStats = fs.statSync(name);

        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
        	if(path.extname(name) === '.jpg') files_.push(name);
        }
    }

    return files_;
}

var files = getFiles(dirPath);

files.forEach(function(file) {
	var fileObj = {
		id: '',
		user: {
			id: ''
		},
		local: true,
		shown: -1,
		images: {
			standard_resolution: {
				url: ''
			}
		}
	};

	fileObj.id = file.replace(dirPath + '/', '').split('.')[0];
	fileObj.images.standard_resolution.url = file;

	output.data.push(fileObj);
});

var outputFilename = 'data/local-images.json';

fs.writeFile(outputFilename, JSON.stringify(output, null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + outputFilename);
    }
}); 