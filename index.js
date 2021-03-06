var fs = require("fs");
var path = require('path');
var Handlebars = require("handlebars");
var markdown = require('helper-markdown');
const handlebarsWax = require('handlebars-wax');




Handlebars.registerHelper('markdown', function() {
	var markup = markdown().apply(this, arguments);

	// If we end up with a string wrapped in one <p> block, remove it so we don't create a new text block
	var startEndMatch = markup.match(/^<p>(.*)<\/p>\n$/);
	return startEndMatch && startEndMatch[1].indexOf("<p>") === -1 ?
		startEndMatch[1] :
		markup;
});

Handlebars.registerHelper('displayUrl', function(str) {
	return str.replace(/https?:\/\//, "");
});

Handlebars.registerHelper('toLowerCase', function(str) {
	return str.toLowerCase();
});

Handlebars.registerHelper('year', function(str) {
	if (str) {
		var d = new Date(str);
		return d.getFullYear();
	} else {
		return "Present"
	}
});

Handlebars.registerHelper('award', function(str) {
	switch (str.toLowerCase()) {
		case "bachelor":
		case "master":
			return str + "s";
		default:
			return str;
	}
});

Handlebars.registerHelper('skillLevel', function(str) {
	switch (str.toLowerCase()) {
		case "beginner":
		case "1":
			return "25%";
		case "intermediate":
		case "2":
			return "50%";
		case "advanced":
		case "3":
		case "4":
			return "75%";
		case "master":
		case "5":
			return "100%";
		default:
			return parseInt(str) + "%"
	}
});

Handlebars.registerHelper('paragraphSplit', (plaintext) => {
    const lines = plaintext instanceof Array ? plaintext.map(l => l.split(/\r\n|\r|\n/g)).reduce((flat, toFlatten) => flat.concat(toFlatten), []) : plaintext.split(/\r\n|\r|\n/g);
    const output = lines.filter(line => line).reduce((a, b) => `${a}<p>${b}</p>`, '');
    return new Handlebars.SafeString(output);
});
Handlebars.registerHelper('safeString', (plaintext) => {
    return new Handlebars.SafeString(plaintext.trim());
});


// Resume.json used to have website property in some entries.  This has been renamed to url.
// However the demo data still uses the website property so we will also support the "wrong" property name.
// Fix the resume object to use url property
function fixResume(resume) {
	if (resume.basics.website) {
		resume.basics.url = resume.basics.website;
		delete resume.basics.website
	}
	fixAllEntries(resume.work);
	fixAllEntries(resume.volunteer);
	fixAllEntries(resume.publications);
	fixAllEntries(resume.projects);

	fixWork(resume.work);
}

function fixAllEntries(entries) {
	if (entries) {
		for (var i=0; i < entries.length; i++) {
			var entry = entries[i];
			if (entry.website) {
				entry.url = entry.website;
				delete entry.website;
			}
		}
	}
}

// work.company has been renamed as work.name in v1.0.0
function fixWork(work) {
	if (work) {
		for (var i=0; i < work.length; i++) {
			var entry = work[i];
			if (entry.company) {
				entry.name = entry.company;
				delete entry.website;
			}
		}

	}
}

function render(resume) {
	let wax = handlebarsWax(Handlebars);
	var bootstrap = fs.readFileSync(__dirname + "/assets/css/bootstrap.css", "utf-8");
	var css = fs.readFileSync(__dirname + "/assets/css/styles.css", "utf-8");
	var js = fs.readFileSync(__dirname + "/assets/js/main.js", "utf-8");
	var tpl = fs.readFileSync(__dirname + "/resume.hbs", "utf-8");

	fixResume(resume);

	var partialsDir = path.join(__dirname, 'partials/**/*.hbs');
	wax.partials(partialsDir);	

	return wax.compile(tpl)({
		bootstrap: bootstrap,
		css: css,
		js: js,
		resume: resume
	});
}

module.exports = {
	render: render
};