const seasons = ["winter", "spring", "summer", "fall"];
const mediaTypes = ["tv", "ova", "movie", "special"];
const dataTypes = ["user", "total"];
const proxyUrl = "https://cors-anywhere-ply9.onrender.com/";
const maxYear = 2022;

var nonSeasonal = [];

generateHtml();
getData();


function getData() {
	const includedStatuses = ["completed", "dropped"];
	const urlParams = new URLSearchParams(window.location.search);
	const username = urlParams.get('user') ?? 'skroychan';

	var userData = generateDataDict();
	var promises = [];
	for (var s = 0; s < includedStatuses.length; s++) {
		const url = proxyUrl + 'https://api.myanimelist.net/v2/users/' + username + '/animelist?status=' + includedStatuses[s] + '&fields=start_season,media_type&limit=1000&nsfw=true';
		promises.push(
			window.fetch(url, {
				method: 'get',
				headers: { 'X-MAL-CLIENT-ID': 'e8fd816ca8d0ad185d59cc56474be788' }
			})
			.then(response => {
				// todo paging
				return response.json();
			})
			.then(json => {
				const data = json['data'];
				for (var i = 0; i < data.length; i++) {
					const anime = data[i]['node'];
					if (!anime['start_season']) {
						nonSeasonal.push(anime);
						continue;
					}

					const year = parseInt(anime['start_season']['year']);
					const season = anime['start_season']['season'];
					const media_type = normalizeMediaType(anime['media_type']);
					userData[year][season][media_type]++;
				};

				return true;
			})
		);
	};

	Promise.all(promises)
		.finally(_ => fillHtml(userData));
}

function fillHtml(userData) {
	var elems = {};
	for (var i = 1917; i <= maxYear; i++) {
		elems[i] = {};
		for (var s = 0; s < seasons.length; s++) {
			var queriedElement;
			if (i < 1970) {
				queriedElement = document.querySelector("#y19" + i.toString()[2] + "0s");
				elems[i][seasons[s]] = generateElementsDict(queriedElement);
			} else if (i < 1990) {
				queriedElement = document.querySelector("#y" + i);
				elems[i][seasons[s]] = generateElementsDict(queriedElement);
			} else {
				queriedElement = document.querySelector("#y" + i).querySelector("." + seasons[s]);
				elems[i][seasons[s]] = generateElementsDict(queriedElement);
			}
			elems[i][seasons[s]]["progress"] = queriedElement.querySelector("progress");
		};
	};

	window.fetch("data.json")
		.then(response => response.json())
		.then(json => {
			for (var i = 1917; i <= maxYear; i++) {
				for (var s = 0; s < seasons.length; s++) {
					var userTotal = 0;
					var total = 0;
					for (var t = 0; t < mediaTypes.length; t++) {
						for (var k = 0; k < dataTypes.length; k++) {
							const element = elems[i][seasons[s]][mediaTypes[t]][dataTypes[k]];
							if (dataTypes[k] == "user") {
								userTotal += userData[i][seasons[s]][mediaTypes[t]];
								element.textContent = parseInt(element.textContent) + userData[i][seasons[s]][mediaTypes[t]];
							} else {
								total += json[i][seasons[s]][mediaTypes[t]];
								element.textContent = parseInt(element.textContent) + json[i][seasons[s]][mediaTypes[t]];
							}
						}
					};
					const progress = elems[i][seasons[s]]["progress"];
					progress.setAttribute("value", parseInt(progress.getAttribute("value")) + userTotal);
					progress.setAttribute("max", parseInt(progress.getAttribute("max")) + total);
				}
			};
		});
}

function generateElementsDict(element) {
	var result = {};

	for (var mt = 0; mt < mediaTypes.length; mt++) {
		result[mediaTypes[mt]] = {};
		for (var dt = 0; dt < dataTypes.length; dt++) {
			result[mediaTypes[mt]][dataTypes[dt]] = element.querySelector("." + mediaTypes[mt]).querySelector("." + dataTypes[dt]);
		};
	};

	return result;
}

function generateDataDict() {
	var result = {};

	for (var i = 1917; i <= maxYear; i++) {
		result[i] = {};
		for (var s = 0; s < seasons.length; s++) {
			result[i][seasons[s]] = {};
			for (var t = 0; t < mediaTypes.length; t++) {
				result[i][seasons[s]][mediaTypes[t]] = 0;
			}
		}
	}

	return result;
}

function normalizeMediaType(mediaType) {
	if (mediaType == "movie") {
		return "movie";
	} else if (mediaType == "ova") {
		return "ova";
	} else if (mediaType == "tv" || mediaType == "ona") {
		return "tv";
	} else {
		return "special";
	}
}

function generateHtml() {
	const table = document.createElement("div");
	table.classList.add("table");

	for (var i = maxYear; i >= 1990; i--) {
		appendSeasonalRowElements(table, i);
	};

	appendYearlyRowElements(table, 1985, 1989);
	appendYearlyRowElements(table, 1980, 1984);
	appendYearlyRowElements(table, 1975, 1979);
	appendYearlyRowElements(table, 1970, 1974);
	
	appendDecadeRowElements(table);

	document.body.appendChild(table);
}

function appendYearlyRowElements(element, from, to) {
	const rowWrapper = document.createElement("div");
	rowWrapper.classList.add("rowWrapper");
	const row = document.createElement("div");
	row.classList.add("row");
	row.classList.add("yearlyRow");
	appendYearElements(row, from, to);
	rowWrapper.appendChild(row);
	element.appendChild(rowWrapper);
}

function appendYearElements(element, from, to) {
	for (var i = from; i <= to; i++) {
		const year = document.createElement("div");
		year.setAttribute("id", "y" + i);
		year.classList.add("column");
		year.innerHTML = "<span class=\"title\">" + i + "</span>";
		fillElements(year);
		element.appendChild(year);
	};
}

function appendDecadeRowElements(element) {
	const decades = document.createElement("div");
	decades.setAttribute("id", "decades");
	decades.classList.add("row");
	decades.classList.add("decadeRow");
	for (var i = 1910; i < 1970; i += 10) {
		const decade = document.createElement("div");
		decade.setAttribute("id", "y" + i + "s");
		decade.classList.add("column");
		decade.innerHTML = "<span class=\"title\">" + i + "s</span>";
		fillElements(decade);
		decades.appendChild(decade);
	}
	element.appendChild(decades);
}

function appendSeasonalRowElements(element, year) {
	const yearDiv = document.createElement("div");
	yearDiv.setAttribute("id", "y" + year);
	yearDiv.classList.add("rowWrapper");
	yearDiv.innerHTML = "<div class=\"rowTitle\">" + year + "</div>";
	const row = document.createElement("div");
	row.classList.add("seasonalRow")
	row.classList.add("row");
	for (var s = 0; s < seasons.length; s++) {
		const season = document.createElement("div");
		season.classList.add("column");
		season.classList.add(seasons[s]);
		season.innerHTML = "<span class=\"title\">" + seasons[s] + "</span>";
		fillElements(season);
		row.appendChild(season);
	};
	yearDiv.appendChild(row);
	element.appendChild(yearDiv);
}

function fillElements(element) {
	const typesRow = document.createElement("div");
	typesRow.classList.add("types");
	const leftCol = document.createElement("div");
	const rightCol = document.createElement("div");
	for (var t = 0; t < mediaTypes.length; t++) {
		const div = document.createElement("div");
		div.classList.add("type");
		div.classList.add(mediaTypes[t]);
		div.innerHTML = mediaTypes[t] + ": <span class=\"user\">0</span>/<span class=\"total\">0</span>";
		if (t < mediaTypes.length / 2) {
			leftCol.appendChild(div);
		} else {
			rightCol.appendChild(div);
		}
	};
	typesRow.appendChild(leftCol);
	typesRow.appendChild(rightCol);
	element.appendChild(typesRow);

	const progressBar = document.createElement("progress");
	progressBar.setAttribute("value", 0);
	progressBar.setAttribute("max", 0);
	element.appendChild(progressBar);
}
