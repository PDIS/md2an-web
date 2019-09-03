import React, {useState} from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles } from '@material-ui/core/styles';
import _ from 'lodash';
import css from './App.css'

const js2xmlparser = require('js2xmlparser');
const jsonxml = require('jsontoxml');
const format = require('xml-formatter');
const marked = require('marked');
const he = require('he');

const useStyles = makeStyles(theme => ({
  appBar: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  toolbar: {
    flexWrap: 'wrap',
  },
  toolbarTitle: {
    flexGrow: 1,
  },
  link: {
    margin: theme.spacing(1, 1.5),
  },
}))

const md2an = (input) => {
  let references = []
  let debateSection = []
  let speakers = []
  let sections = input.replace(/\n:::info\n[\d\D]*?\n:::\n/, '').split('###')
  debateSection.push({'heading':(input.match(/^#* (.*)/) || [])[1]})
  sections.map( section => {
    // first section = ''
    if (! /\S/.test(section)) { return }
    // info section
    if (/🌐|📅|🏡/.exec(section)) {
      let lines = section.split(/\n+/)
      lines.map( line => {
        if (/(?=.*>)(?=.*\[)(?=.*（).*/.exec(line)) {
          let type = line.match(/\[(.*?)\]/)[1]
          let narrative = {
            'name': 'narrative',
            children: [
              {
                'p': {
                  'i': '（請點選 <a href="' + line.match(/\((.*?)\)/)[1] + '">' + type + '</a> 參考）'
                }
              }
            ]
          }
          debateSection.push(narrative)
          return
        }
      })
    }
    let speaker = (section.match(/ (.*?)[:：]\n/) || [])[1]
    // speaker sections
    if (speaker) {
      let context = section.replace(/ (.*?)[:：]\n/, '')
      context.split(/[\r\n]{2,}/).map(p => {
        if (!/\S/.test(p)) { return }
        if (/^>/.exec(p)) {
          let narrative = {
            'name': 'narrative',
            children: [
              {
                'p': {
                  'i': p.replace(/>\s+/,'')
                }
              }
            ]
          }
          debateSection.push(narrative)
          return
        }
        let speech = {
          'name': 'speech',
          'attrs': { 
            'by': '#' + speaker 
          },
          children: [
            {
              'p': he.decode(marked(p.replace(/^[\r\n]+/, ''), { smartypants: true })).replace(/^\s*<p>\s*|\s*<\/p>\s*$/g, ''),
            }
          ]
        }
        debateSection.push(speech)
      })
      speakers.push(speaker)
    }
  })
  speakers = _.uniq(speakers)
  speakers.map( speaker => {
    let TLCPerson = {
      'name': 'TLCPerson',
      'attrs': { 
        href: "/ontology/person/::/" + speaker,
        id: speaker,
        showAs: speaker,
      },
    }
    references.push(TLCPerson)
  })
  if (/Office Hour_/.test(debateSection.heading)) {
    let heading = debateSection.heading.replace(/_[^_]*$/, '')
    debateSection.heading = debateSection.heading.replace(/.*Office Hour_/, '')
    debateSection = { 'heading': heading, 'debateSection': debateSection }
  }
  let xml = jsonxml({
    'akomaNtoso':{
      'debate': {
        'meta': { 
          references 
        },
        'debateBody': 
        { 
          'debateSection': debateSection
        }
      }
    }
  }, {'xmlHeader': true})
  let output = format(xml)
  return output
}

const findTitle  = (input) => {
  return (input.match(/^#* (.*)/) || [])[1].replace(/\s/g, '-') + '.an.xml'
}

function App() {
  const classes = useStyles();
  const [values, setValues] = useState('');
  const [title, setTitle] = useState('md2an');
  const handleChange = a => event => {
    let output = md2an(event.target.value)
    let title = findTitle(event.target.value)
    setValues(output)
    setTitle(title)
  };
  return (
    <React.Fragment>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={0} className={classes.appBar} >
        <Toolbar className={classes.toolbar}>
          <Typography variant="h6" color="inherit" noWrap className={classes.toolbarTitle}>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>
        <textarea autoFocus id="input" onChange={handleChange()} style={{background: '#ddd'}}></textarea>
        <textarea id="output" value={values}></textarea>
    </React.Fragment>
  );
}

export default App;
