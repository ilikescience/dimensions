import * as d3 from 'd3';
import * as tsnejs from './vendor/tsne';

const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

const catColor = d3.scaleOrdinal(d3.schemeCategory20);

const buildGenreLegend = (legendElement) => {
  const legend = legendElement;

  /* let's get a genre list */
  const genres = [];

  d3.csv('/data/songs.csv', (error, data) => {
    if (error) throw error;

    data.map((item) => {
      if (!genres.includes(item.genre)) genres.push(item.genre);
      return true;
    });

    genres.forEach((item) => {
      const legendItem = document.createElement('div');
      legendItem.classList.add('legend--item');

      legendItem.innerHTML = `
        <div
          class="legend--marker"
          style="background:${catColor(item)}"></div>
          ${item}
      `;

      legendItem.addEventListener('mouseover', (e) => {
        document
          .querySelectorAll('.legend--item')
          .forEach(thisItem => thisItem.classList.add('is-inactive'));
        e.target.classList.remove('is-inactive');
        document
          .querySelectorAll('.dot')
          .forEach(thisItem => thisItem.classList.add('is-inactive'));
        document
          .querySelectorAll(`.dot[data-genre="${item}"]`)
          .forEach(thisItem => thisItem.classList.remove('is-inactive'));
      });

      legendItem.addEventListener('mouseout', () => {
        document
          .querySelectorAll('.legend--item')
          .forEach(thisItem => thisItem.classList.remove('is-inactive'));
        document
          .querySelectorAll('.dot')
          .forEach(thisItem => thisItem.classList.remove('is-inactive'));
      });
      legend.appendChild(legendItem);
    });
  });
};

/* eslint-disable no-param-reassign */
const fadeIn = (audioPlayer) => {
  if (audioPlayer.volume < 0.95) {
    audioPlayer.volume += 0.05;
    setTimeout(() => {
      fadeIn(audioPlayer);
    }, 10);
  }
};

const fadeOut = (audioPlayer) => {
  if (audioPlayer.volume >= 0.9) {
    audioPlayer.volume -= 0.1;
    setTimeout(() => {
      fadeOut(audioPlayer);
    }, 50);
  } else {
    audioPlayer.volume = 0;
    audioPlayer.pause();
  }
};
/* eslint-enable no-param-reassign */

let startAudio;

const startPreview = (d) => {
  const audioPlayer = document.querySelector('audio');
  const re = /(?:mp3-preview\/)(\S+)(?:\?)/g;
  const previewUrl = re.exec(d.preview)[1];
  audioPlayer.setAttribute('src', `audio/${previewUrl}.mp3`);
  audioPlayer.play();
  fadeIn(audioPlayer);
};

const stopPreview = () => {
  const audioPlayer = document.querySelector('audio');
  fadeOut(audioPlayer);
};

const margin = { top: 20, right: 10, bottom: 50, left: 60 };
const width = 900 - margin.left - margin.right;
const height = 450 - margin.top - margin.bottom;

// Define the div for the tooltip
const toolTip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);

// Handle hovers
const handleMouseOver = (typedData, event, index) => {
  const xPos = event.pageX;
  const yPos = event.pageY;
  startAudio = window.setTimeout(() => {
    // startPreview(typedData[index]);
    toolTip.transition().duration(200).style('opacity', 0.9);
    toolTip
      .html(`<strong>${typedData[index].songName}</strong><br/>${typedData[index].artist}`)
      .style('left', `${xPos}px`)
      .style('top', `${yPos - 50}px`);
  }, 200);
};

const handleMouseOut = () => {
  clearTimeout(startAudio);
  // stopPreview();
  toolTip.transition().duration(500).style('opacity', 0);
};

const initLine = () => {
  const x = d3.scaleLinear().range([0, width]);
  const xAxis = d3.axisBottom(x);

  d3.csv('/data/songs.csv', (error, data) => {
    if (error) throw error;

    const typedData = data.map(item => ({
      songName: item.track_name,
      artist: item.artist,
      danceability: +item.danceability,
      valence: +item.valence,
      acousticness: +item.acousticness,
      genre: item.genre,
      preview: item.preview
    }));

    const graphs = ['danceability', 'valence', 'acousticness'];

    graphs.forEach((item) => {
      const lineSvg = d3
        .select('.graph--line')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', '80px')
        .attr('style', 'margin-bottom: 6em')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      x.domain(d3.extent(typedData, d => d[item])).nice();

      lineSvg
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,10)')
        .call(xAxis)
        .append('text')
        .attr('class', 'label')
        .attr('x', width / 2)
        .attr('y', '35')
        .style('text-anchor', 'middle')
        .style('font-size', '16px')
        .text(capitalize(item));

      lineSvg
        .selectAll('.dot')
        .data(typedData)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', 5)
        .attr('cx', d => x(d[item]))
        .style('fill', '#444')
        .on('mouseenter', (d, i) => { handleMouseOver(typedData, d3.event, i); })
        .on('mouseout', () => { handleMouseOut(); });
    });
  });
};

const initRug = () => {
  const x = d3.scaleLinear().range([20, width]);
  const y = d3.scaleLinear().range([height - 20, 0]);

  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y);

  const svg = d3
    .select('.graph--rug')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  d3.csv('/data/songs.csv', (error, data) => {
    if (error) throw error;

    const typedData = data.map(item => ({
      songName: item.track_name,
      artist: item.artist,
      loudness: +item.loudness,
      energy: +item.energy,
      genre: item.genre,
      preview: item.preview
    }));

    x.domain(d3.extent(typedData, d => d.loudness)).nice();
    y.domain(d3.extent(typedData, d => d.energy)).nice();

    svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .append('text')
      .attr('class', 'label')
      .attr('x', width / 2)
      .attr('y', '3em')
      .style('text-anchor', 'middle')
      .text('Loudness');

    svg
      .append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('class', 'label')
      .attr('transform', 'rotate(-90)')
      .attr('y', '-3em')
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .text('Energy');

    svg
      .selectAll('.dot')
      .data(typedData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('r', 5)
      .attr('cx', d => x(d.loudness))
      .attr('cy', d => y(d.energy))
      .style('fill', '#444')
      .on('mouseenter', (d, i) => { handleMouseOver(typedData, d3.event, i); })
      .on('mouseout', () => { handleMouseOut(); });

    svg
      .selectAll('.dash-x')
      .data(typedData)
      .enter()
      .append('rect')
      .attr('class', 'dash-x')
      .attr('width', 1)
      .attr('height', 10)
      .attr('y', height - 10)
      .attr('x', d => x(d.loudness));

    svg
      .selectAll('.dash-y')
      .data(typedData)
      .enter()
      .append('rect')
      .attr('class', 'dash-y')
      .attr('height', 1)
      .attr('width', 10)
      .attr('x', 0)
      .attr('y', d => y(d.energy));
  });
};

const initBubble = () => {
  const x = d3.scaleLinear().range([20, width]);
  const y = d3.scaleLinear().range([height - 20, 0]);
  const z = d3.scaleLinear().range([4, 25]);

  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y);

  const svg = d3
    .select('.graph--bubble')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  d3.csv('/data/songs.csv', (error, data) => {
    if (error) throw error;

    const typedData = data.map(item => ({
      songName: item.track_name,
      artist: item.artist,
      loudness: +item.loudness,
      energy: +item.energy,
      tempo: +item.tempo,
      genre: item.genre,
      preview: item.preview
    }));

    const sorted = typedData.sort((a, b) => b.tempo - a.tempo);

    x.domain(d3.extent(sorted, d => d.loudness)).nice();
    y.domain(d3.extent(sorted, d => d.energy)).nice();
    z.domain(d3.extent(sorted, d => d.tempo));

    svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .append('text')
      .attr('class', 'label')
      .attr('x', width / 2)
      .attr('y', '3em')
      .style('text-anchor', 'middle')
      .text('Loudness');

    svg
      .append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('class', 'label')
      .attr('transform', 'rotate(-90)')
      .attr('y', '-3em')
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .text('Energy');

    svg
      .selectAll('.dot')
      .data(sorted)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('r', d => z(d.tempo))
      .attr('cx', d => x(d.loudness))
      .attr('cy', d => y(d.energy))
      .style('fill', '#aaa')
      .style('stroke', '#444')
      .on('mouseenter', (d, i) => { handleMouseOver(typedData, d3.event, i); })
      .on('mouseout', () => { handleMouseOut(); });
  });
};

const initColorBubble = () => {
  const x = d3.scaleLinear().range([20, width]);
  const y = d3.scaleLinear().range([height - 20, 0]);
  const z = d3.scaleLinear().range([4, 25]);

  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y);

  const svg = d3
    .select('.graph--colorBubble')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  d3.csv('/data/songs.csv', (error, data) => {
    if (error) throw error;

    const typedData = data.map(item => ({
      songName: item.track_name,
      artist: item.artist,
      loudness: +item.loudness,
      energy: +item.energy,
      tempo: +item.tempo,
      genre: item.genre,
      preview: item.preview
    }));

    const sorted = typedData.sort((a, b) => b.tempo - a.tempo);

    x.domain(d3.extent(sorted, d => d.loudness)).nice();
    y.domain(d3.extent(sorted, d => d.energy)).nice();
    z.domain(d3.extent(sorted, d => d.tempo));

    svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .append('text')
      .attr('class', 'label')
      .attr('x', width / 2)
      .attr('y', '3em')
      .style('text-anchor', 'middle')
      .text('Loudness');

    svg
      .append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('class', 'label')
      .attr('transform', 'rotate(-90)')
      .attr('y', '-3em')
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .text('Energy');

    svg
      .selectAll('.dot')
      .data(sorted)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('r', d => z(d.tempo))
      .attr('cx', d => x(d.loudness))
      .attr('cy', d => y(d.energy))
      .attr('data-genre', (d, i) => typedData[i].genre)
      .style('fill', (d, i) => catColor(typedData[i].genre))
      .style('stroke', '#fff')
      .on('mouseenter', (d, i) => { handleMouseOver(typedData, d3.event, i); })
      .on('mouseout', () => { handleMouseOut(); });
  });

  buildGenreLegend(document.querySelector('.legend--colorBubble'));
};

const initTsne = () => {
  const tsneOpts = {
    epsilon: 10,
    perplexity: 50,
    dim: 2
  };

  /* eslint-disable */
  const tsne = new tsnejs.tSNE(tsneOpts);
  /* eslint-enable */

  const x = d3.scaleLinear().range([20, width]);
  const y = d3.scaleLinear().range([height - 20, 0]);

  const tsneGraph = d3
    .select('.graph--tsne')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top)
    .append('g')
    .attr('transform', `translate(0,${margin.top})`);

  d3.csv('/data/songs.csv', (error, data) => {
    if (error) throw error;

    const typedData = data.map(item => ({
      artist: item.artist,
      songName: item.track_name,
      loudness: +item.loudness,
      energy: +item.energy,
      genre: item.genre,
      preview: item.preview
    }));

    const tsneDists = data.map(item => [
      +item.danceability,
      +item.energy,
      +item.loudness,
      +item.mode,
      +item.speechiness,
      +item.acousticness,
      +item.instrumentalness,
      +item.liveness,
      +item.valence,
      +item.tempo
    ]);

    tsne.initDataRaw(Object.values(tsneDists));

    for (let k = 0; k < 2000; k += 1) {
      tsne.step();
    }

    const tsneSolution = tsne.getSolution();

    x.domain(d3.extent(tsneSolution, d => d[0]));
    y.domain(d3.extent(tsneSolution, d => d[1]));

    tsneGraph
      .selectAll('.dot')
      .data(tsneSolution)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('r', 8)
      .attr('cx', d => x(d[0]))
      .attr('cy', d => y(d[1]))
      .attr('data-song', (d, i) => typedData[i].songName)
      .attr('data-genre', (d, i) => typedData[i].genre)
      .style('fill', (d, i) => catColor(typedData[i].genre))
      .on('mouseenter', (d, i) => { handleMouseOver(typedData, d3.event, i); })
      .on('mouseout', () => { handleMouseOut(); });
  });

  buildGenreLegend(document.querySelector('.legend--tsne'));
};

document.addEventListener('DOMContentLoaded', () => {
  initLine();
  initRug();
  initBubble();
  initColorBubble();
  initTsne();
});
