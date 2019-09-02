import React, {useState} from 'react';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles } from '@material-ui/core/styles';
import _ from 'lodash';
import GitHubLogin from 'github-login';
import css from './App.css'
const js2xmlparser = require('js2xmlparser');
const jsonxml = require('jsontoxml');
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

const onSuccess = response => console.log(response);
const onFailure = response => console.error(response);

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
  let output = jsonxml({
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
  }, {'xmlHeader': true, 'prettyPrint' : true})
  return output
  // debateSection.heading = (input.match(/^#* (.*)/) || [])[1]
  // sections.map( section => {
  //   // first section = ''
  //   if (! /\S/.test(section)) { return }
  //   // info section
  //   if (/🌐|📅|🏡/.exec(section)) {
  //     let lines = section.split(/\n+/)
  //     lines.map( line => {
  //       if (/(?=.*>)(?=.*\[)(?=.*（).*/.exec(line)) {
  //         let type = line.match(/\[(.*?)\]/)[1]
  //         let narrative = {
  //           'p': {
  //             'i': '（請點選 <a href="' + line.match(/\((.*?)\)/)[1] + '">' + type + '</a> 參考）'
  //           }
  //         }
  //         debateSection.narrative.push(narrative)
  //         return
  //       }
  //     })
  //   }
  //   let speaker = (section.match(/ (.*?)[:：]\n/) || [])[1]
  //   // speaker sections
  //   if (speaker) {
  //     let context = section.replace(/ (.*?)[:：]\n/, '')
  //     context.split(/[\r\n]{2,}/).map(p => {
  //       if (!/\S/.test(p)) { return }
  //       let speech = {
  //        '@': { 
  //          'by': '#' + speaker 
  //        },
  //        'p': he.decode(marked(p.replace(/^[\r\n]+/, ''), { smartypants: true })).replace(/^\s*<p>\s*|\s*<\/p>\s*$/g, '')
  //       }
  //       debateSection.speech.push(speech)
  //     })
  //     speakers.push(speaker)
  //   }
  // })
  // speakers = _.uniq(speakers)
  // speakers.map( speaker => {
  //   let TLCPerson = {
  //     '@': { 
  //       href: "/ontology/person/::/" + speaker,
  //       id: speaker,
  //       showAs: speaker,
  //     },
  //   }
  //   references.TLCPerson.push(TLCPerson)
  // })
  // if (/Office Hour_/.test(debateSection.heading)) {
  //   let heading = debateSection.heading.replace(/_[^_]*$/, '')
  //   debateSection.heading = debateSection.heading.replace(/.*Office Hour_/, '')
  //   debateSection = { 'heading': heading, 'debateSection': debateSection }
  // }
  // let an = { 
  //   'debate': {
  //       'meta': { 
  //         references 
  //     },
  //     'debateBody': 
  //     { 
  //       'debateSection': debateSection
  //     }
  //   }
  // }
  // let output = js2xmlparser.parse('akomaNtoso', an)
  // output = output.replace(/&lt;/g, '<')
  /* return output */
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
{/*           <Button href="#" color="primary" variant="outlined" className={classes.link}>
            Submit
          </Button>
          <GitHubLogin clientId="7a7d8d6ba2a6f5847e5c"
            buttonText="Login"
            className="MuiButtonBase-root MuiButton-root makeStyles-link-4 MuiButton-outlined MuiButton-outlinedPrimary"
            onSuccess={onSuccess}
            onFailure={onFailure}
            redirectUri="http://localhost:3000/"
          /> */}
        </Toolbar>
      </AppBar>
        <textarea autoFocus id="input" onChange={handleChange()} style={{background: '#ddd'}}></textarea>
        <textarea id="output" value={values}></textarea>
        {/* <Grid container spacing={1}>
          <Grid item xs={12}>
            <TextField
              id="input"
              label="INPUT"
              onChange={handleChange()}
              margin="normal"
              multiline
              fullWidth
              variant="outlined"
              autoFocus={true} 
            />
            <TextField
              id="output"
              label="OUTPUT"
              margin="normal"
              multiline
              fullWidth
              value={values}
              variant="outlined"
              autoFocus={true} 
            />
          </Grid>
        </Grid> */}
    </React.Fragment>
  );
}

export default App;
