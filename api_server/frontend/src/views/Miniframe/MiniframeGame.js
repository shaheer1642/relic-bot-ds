/* eslint eqeqeq: "off", no-unused-vars: "off" */

import React from 'react';
import {Grid, Typography, } from '@mui/material';
import { withHooksHOC } from '../../withHooksHOC';
import { generateDummyArray, getRandomInt, getRandomLocation } from './Functions';
import {socket,socketHasConnected} from '../../websocket/socket'

class MiniframeGame extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

      characters: [],

      mapSizeH: 0,
      mapSizeV: 0,

      props: {
          healths: [],
          armors: [],
          enemies: [],
          swords: [],
          guns: [],
      },

      mouseClicked: false
    };
    this.canvasRef = React.createRef(null)
    this.characterImage = new Image();
    this.characterImage.src = "/icons/KEKFC.png";
  }

  componentDidMount() {
    console.log('[MiniframeGame] componentDidMount')
    socketHasConnected().then(() => {
      this.spawnCharacter(() => this.fetchGameData())
    })
    
    this.drawCanvas()

    setInterval(() => {
      this.drawCanvas()
    }, 16.67);

    document.addEventListener("keydown", this.handleKeyDown);
    socket.addEventListener('miniframe/listeners/characterUpdated', this.characterUpdatedListener)
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
    socket.removeEventListener('miniframe/listeners/characterUpdated', this.characterUpdatedListener)
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseMove = (e) => {
    this.moveChar([e.pageX, e.pageY])
  }
  handleMouseDown = (event) => {
    if (event.button == 0) {
      this.setState({mouseClicked: true})
    }
  };
  handleMouseUp = (event) => {
    if (event.button == 0) {
      this.setState({mouseClicked: false})
    }
  };

  characterUpdatedListener = (data) => {
    this.setState(state => ({
      characters: data.map(char => char.character_id == socket.id ? state.characters.filter(chari => chari.character_id == socket.id)[0] || char : char)
    }))
  }

  drawCanvas = () => {
    const canvas = this.canvasRef.current
    const context = canvas.getContext('2d')
    context.canvas.width  = this.state.mapSizeH;
    context.canvas.height = this.state.mapSizeV;
    context.clearRect(0, 0, canvas.width, canvas.height)
    //Our first draw
    const fontSize = 56
    context.fillStyle = '#ffffff'
    context.font = `${fontSize}px Arial`
    const currentCharacter = this.state.characters.find(char => char.character_id == socket.id)
    if (!currentCharacter) return
    context.fillText(`${currentCharacter.health} ❤️            ${currentCharacter.armor} 🛡️`, 0, 0 + fontSize)
    this.state.characters.forEach(char => {
      context.fillText(char.character_id, char.location[0],char.location[1])
      context.drawImage(this.characterImage,char.location[0],char.location[1],96,96)
    })
    this.state.props.healths.forEach(loc => {
      context.fillText('❤️', loc[0],loc[1] + fontSize)
    })
    this.state.props.armors.forEach(loc => {
      context.fillText('🛡️', loc[0],loc[1] + fontSize)
    })
    this.state.props.enemies.forEach(loc => {
      context.fillText('👻', loc[0],loc[1] + fontSize)
    })
    this.state.props.swords.forEach(loc => {
      context.fillText('⚔️', loc[0],loc[1] + fontSize)
    })
    this.state.props.guns.forEach(loc => {
      context.fillText('🔫', loc[0],loc[1] + fontSize)
    })
  }

  clearCanvas = () => {
    const canvas = this.canvasRef.current
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  handleKeyDown = (event) => {
    switch( event.keyCode ) {
        case 37:
          this.moveChar('left');
          break;
        case 38:
          this.moveChar('up');
          break;
        case 39:
          this.moveChar('right');
          break;
        case 40:
          this.moveChar('down');
          break;
        default: 
          break;
    }
  }

  spawnCharacter = (callback) => {
    socket.emit('miniframe/characters/spawn',{},(res) => {
      if (res.code == 200) {
        if (callback) callback()
      }
    })
  }

  fetchGameData = () => {
    socket.emit('miniframe/gamedata/fetch',{},(res) => {
      console.log(res)
      if (res.code == 200) {
        this.setState({
          ...res.data
        })
      }
    })
  }

  moveChar = (new_loc) => {
    this.setState(state => ({
      characters: state.characters.map(char => {
        if (char.character_id == socket.id) 
          return ({
            ...char,
            location: new_loc
          })
        else return char
      })
    }), () => {
      socket.emit('miniframe/characters/update',{ character: this.state.characters.filter(char => char.character_id == socket.id)[0]})
    })
  }

  generateMap = () => {
    if (this.generateMapTimeout) return this.cacheMap
    this.generateMapTimeout = true
    const ts = new Date().getTime()
    console.log('generatingMap')
    const map = []
    map.push(
      this.generateItem({ text: `${this.state.char_health} ❤️            ${this.state.char_armor} 🛡️`, columns: this.state.mapSizeH})
    )

    for (let i = 0; i < this.state.mapSizeV; i++) {
        for (let j = 0; j < this.state.mapSizeH; j++) {
            if (this.state.characters.some(char => i == char.location[1] && j == char.location[0]))
              map.push(this.generateItem({text: <img src="/icons/KEKFC.png" width={'48px'} height={'48px'}/>, loc: [j, i]}))
            else if (j == 0 || j == this.state.mapSizeH - 1)
              map.push(this.generateItem({text: '|', loc: [j, i]}))
            else if (i == 0 || i == this.state.mapSizeV - 1)
              map.push(this.generateItem({text: '-', loc: [j, i]}))
            else if (this.state.props.healths.some(loc => loc[0] == j && loc[1] == i))
              map.push(this.generateItem({text: '❤️', loc: [j, i]}))
            else if (this.state.props.armors.some(loc => loc[0] == j && loc[1] == i))
              map.push(this.generateItem({text: '🛡️', loc: [j, i]}))
            else if (this.state.props.enemies.some(loc => loc[0] == j && loc[1] == i))
              map.push(this.generateItem({text: '👻', loc: [j, i]}))
            else if (this.state.props.swords.some(loc => loc[0] == j && loc[1] == i))
              map.push(this.generateItem({text: '⚔️', loc: [j, i]}))
            else if (this.state.props.guns.some(loc => loc[0] == j && loc[1] == i))
              map.push(this.generateItem({text: '🔫', loc: [j, i]}))
            else 
              map.push(this.generateItem({text: ' ', loc: [j, i]}))
        }
    }

    console.log('map generated in',new Date().getTime() - ts,'ms')
    this.cacheMap = map
    setTimeout(() => {
      this.generateMapTimeout = false
    }, 10);
    return map
  }

  generateItem = ({text, columns, sx, loc}) => {
    return (
      <div></div>
    )
  }

  render() {
    return (
      <canvas ref={this.canvasRef} width={this.state.mapSizeH} height={this.state.mapSizeV}>

      </canvas>
    );
  }
}

export default withHooksHOC(MiniframeGame);