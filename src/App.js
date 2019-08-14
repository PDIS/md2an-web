import React, {useState} from 'react';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import _ from 'lodash';
import GitHubLogin from 'github-login';
/* import css from './App.css' */
const js2xmlparser = require('js2xmlparser');

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
  let references = {'TLCPerson': []}
  let debateSection = {'heading':'','narrative':[],'speech':[]}
  let speakers = []
  let sections = input.split('###')
  sections.map( section => {
    // first section = ''
    if (section === '') {
      return
    }
    // info section
    if (/開始記錄/.exec(section)) {
      debateSection.heading = section.match(/ (.*?) /)[1]
      if (/>/.exec(section)) {
        let narratives = section.split('>')
        narratives.map( n => {
          if (/🌈/.exec(n)) {
            let type = n.match(/\[(.*?)\]/)[1]
            let narrative = {
              'p': {
                'i': '（請點選 <a href="' + n.match(/\((.*?)\)/)[1] + '">' + type + '</a> 參考）'
              }
            }
            debateSection.narrative.push(narrative)
          }
        })     
      }
    }
    // speaker sections
    else {
      let speaker = section.match(/ (.*?)：/)[1]
      let context = (/([^：]*)$/).exec(section)[0].replace(/[\r\n]/g, '')
      let speech = {
        '@': { 
          'by': '#' + speaker 
        },
        'p': context
      }
      debateSection.speech.push(speech)
      speakers.push(speaker)
    }
  })
  speakers = _.uniq(speakers)
  speakers.map( speaker => {
    let TLCPerson = {
      '@': { 
        href: "/ontology/person/::/" + speaker,
        id: speaker,
        showAs: speaker,
      },
    }
    references.TLCPerson.push(TLCPerson)
  })
  let an = { 
    'debate': {
        'meta': { 
          references 
      },
      'debateBody': 
      { 
        'debate-Section': debateSection
      }
    }
  }
  let output = js2xmlparser.parse('akomaNtoso', an)
  output = output.replace(/&lt;/g, '<')
  return output
}

function App() {
  const classes = useStyles();
  const [values, setValues] = useState('');
  const handleChange = a => event => {
    let output = md2an(event.target.value)
    setValues(output)
  };
  return (
    <React.Fragment>
      <AppBar position="static" color="default" elevation={0} className={classes.appBar} >
        <Toolbar className={classes.toolbar}>
          <Typography variant="h6" color="inherit" noWrap className={classes.toolbarTitle}>
            md2an
          </Typography>
          <Button href="#" color="primary" variant="outlined" className={classes.link}>
            Submit
          </Button>
          <GitHubLogin clientId="7a7d8d6ba2a6f5847e5c"
            buttonText="Login"
            className="MuiButtonBase-root MuiButton-root makeStyles-link-4 MuiButton-outlined MuiButton-outlinedPrimary"
            onSuccess={onSuccess}
            onFailure={onFailure}
            redirectUri="http://localhost:3000/"
          />
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl">
        <Grid container spacing={1}>
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
              rows={15}
              rowsMax={15}
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
              rows={15}
              rowsMax={15}
            />
          </Grid>
        </Grid>
      </Container>
    </React.Fragment>
  );
}

export default App;
