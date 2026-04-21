import React, { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

function XTerminal({ onCommand, height = '400px' }) {
  const terminalRef = useRef(null)
  const termRef = useRef(null)
  const fitAddonRef = useRef(null)
  const dataHandlerRef = useRef(null)

  useEffect(() => {
    if (!terminalRef.current || termRef.current) return

    // Initialize terminal
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#00ff00',
        cursor: '#00ff00',
      },
      rows: 25,
      cols: 100,
      convertEol: true,
      scrollback: 1000,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    termRef.current = term
    fitAddonRef.current = fitAddon

    // Print welcome message
    term.writeln('\x1b[1;32m╔══════════════════════════════════════════════════════════════╗\x1b[0m')
    term.writeln('\x1b[1;32m║                    HexStrike AI Terminal                        ║\x1b[0m')
    term.writeln('\x1b[1;32m╚══════════════════════════════════════════════════════════════╝\x1b[0m')
    term.writeln('')
    term.writeln('\x1b[1;33mWelcome to the interactive terminal!\x1b[0m')
    term.writeln('\x1b[1;33mType commands to run security tools directly.\x1b[0m')
    term.writeln('')
    term.writeln('\x1b[1;36mExamples:\x1b[0m')
    term.writeln('  \x1b[1;35m$ nmap -sn 192.168.56.0/24\x1b[0m')
    term.writeln('  \x1b[1;35m$ nmap -sV 192.168.56.101\x1b[0m')
    term.writeln('  \x1b[1;35m$ help\x1b[0m')
    term.writeln('  \x1b[1;35m$ clear\x1b[0m')
    term.writeln('')
    term.write('\x1b[1;32m$\x1b[0m ')

    let currentLine = ''
    let commandHistory = []
    let historyIndex = -1

    // Create data handler
    const handleData = (data) => {
      // Enter key
      if (data === '\r') {
        const command = currentLine.trim()
        term.writeln('')
        
        if (command) {
          commandHistory.unshift(command)
          historyIndex = -1
          
          if (command === 'clear') {
            term.clear()
            term.writeln('\x1b[1;32m╔══════════════════════════════════════════════════════════════╗\x1b[0m')
            term.writeln('\x1b[1;32m║                    HexStrike AI Terminal                        ║\x1b[0m')
            term.writeln('\x1b[1;32m╚══════════════════════════════════════════════════════════════╝\x1b[0m')
            term.writeln('')
            term.write('\x1b[1;32m$\x1b[0m ')
            currentLine = ''
            return
          }
          
          if (command === 'help') {
            term.writeln('\x1b[1;36mAvailable commands:\x1b[0m')
            term.writeln('  \x1b[1;33mnmap\x1b[0m     - Network discovery')
            term.writeln('  \x1b[1;33mgobuster\x1b[0m - Directory brute-force')
            term.writeln('  \x1b[1;33mnuclei\x1b[0m   - Vulnerability scanner')
            term.writeln('  \x1b[1;33mnikto\x1b[0m    - Web server scanner')
            term.writeln('  \x1b[1;33mhydra\x1b[0m    - Password brute-force')
            term.writeln('  \x1b[1;33msqlmap\x1b[0m   - SQL injection')
            term.writeln('  \x1b[1;33mclear\x1b[0m    - Clear terminal')
            term.writeln('  \x1b[1;33mhelp\x1b[0m     - This help')
            term.writeln('')
            term.write('\x1b[1;32m$\x1b[0m ')
            currentLine = ''
            return
          }
          
          if (onCommand) {
            term.writeln(`\x1b[1;34mExecuting: ${command}\x1b[0m`)
            onCommand(command, (output) => {
              term.writeln(output)
              term.write('\x1b[1;32m$\x1b[0m ')
            })
          } else {
            term.writeln(`\x1b[1;31mUnknown: ${command}\x1b[0m`)
            term.write('\x1b[1;32m$\x1b[0m ')
          }
        } else {
          term.write('\x1b[1;32m$\x1b[0m ')
        }
        currentLine = ''
        return
      }
      
      // Backspace
      if (data === '\x7f') {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1)
          term.write('\b \b')
        }
        return
      }
      
      // Up arrow
      if (data === '\x1b[A') {
        if (historyIndex < commandHistory.length - 1) {
          for (let i = 0; i < currentLine.length; i++) {
            term.write('\b \b')
          }
          historyIndex++
          currentLine = commandHistory[historyIndex]
          term.write(currentLine)
        }
        return
      }
      
      // Down arrow
      if (data === '\x1b[B') {
        if (historyIndex > 0) {
          for (let i = 0; i < currentLine.length; i++) {
            term.write('\b \b')
          }
          historyIndex--
          currentLine = commandHistory[historyIndex]
          term.write(currentLine)
        } else if (historyIndex === 0) {
          for (let i = 0; i < currentLine.length; i++) {
            term.write('\b \b')
          }
          historyIndex = -1
          currentLine = ''
        }
        return
      }
      
      // Regular characters (printable)
      if (data.length === 1 && data >= ' ' && data <= '~') {
        currentLine += data
        term.write(data)
      }
    }

    // Store handler reference and attach
    dataHandlerRef.current = handleData
    term.onData(handleData)

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        setTimeout(() => fitAddonRef.current.fit(), 100)
      }
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (termRef.current) {
        // Remove data handler by disposing and recreating? 
        // Actually xterm.js doesn't have offData, so we just dispose the terminal
        termRef.current.dispose()
        termRef.current = null
      }
    }
  }, [onCommand])

  return (
    <div 
      ref={terminalRef} 
      style={{ 
        height: height, 
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#0a0a0a'
      }} 
    />
  )
}

export default XTerminal
