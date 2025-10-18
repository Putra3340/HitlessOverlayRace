"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface Runner {
  id: number
  name: string
  youtubeId: string
  hits: number
  position:
  | "top-left"
  | "bottom-right"
}

export default function TournamentOverlay() {
  const [runners, setRunners] = useState<Runner[]>([
    { id: 1, name: "FirmanGS", youtubeId: "NJNS8L0sJd4", hits: 0, position: "top-left" },
    { id: 2, name: "Nyr 9", youtubeId: "jKmX_Q1jUmc", hits: 0, position: "bottom-right" },
  ])

  const [focusedRunner, setFocusedRunner] = useState<number | null>(null)
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [refreshKeys, setRefreshKeys] = useState<{ [key: number]: number }>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  })
  const [editingUrls, setEditingUrls] = useState(false)
  const [tempUrls, setTempUrls] = useState<{ [key: number]: string }>({})
  const [tempNames, setTempNames] = useState<{ [key: number]: string }>({})
  const [sponsorText, setSponsorText] = useState("Jangan Lupa Like, Comment dan Follow supaya IHC ada event-event yang menarik kedepannya | Indonesian Hitless Community")
  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setTime((time) => time + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])


  // Audio control logic - mute/unmute based on focus
  useEffect(() => {
    const handleAudioControl = () => {
      runners.forEach((runner) => {
        const iframe = document.querySelector(`iframe[title="Player ${runner.id} Stream"]`) as HTMLIFrameElement
        if (iframe) {
          if (focusedRunner === runner.id) {
            // Unmute the focused runner
            iframe.contentWindow?.postMessage('{"event":"command","func":"unMute","args":""}', "*")
          } else {
            // Mute all other runners (or all if no focus)
            iframe.contentWindow?.postMessage('{"event":"command","func":"mute","args":""}', "*")
          }
        }
      })
    }

    // Small delay to ensure iframes are loaded
    const timeoutId = setTimeout(handleAudioControl, 100)
    return () => clearTimeout(timeoutId)
  }, [focusedRunner, runners])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleRunnerClick = (runnerId: number) => {
    setFocusedRunner(focusedRunner === runnerId ? null : runnerId)
  }

  const handleRunnerRightClick = (e: React.MouseEvent, runnerId: number) => {
    e.preventDefault()
    setRunners((prev) => prev.map((runner) => (runner.id === runnerId ? { ...runner, hits: runner.hits + 1 } : runner)))
  }

  const resetHits = () => {
    setRunners((prev) => prev.map((runner) => ({ ...runner, hits: 0 })))
  }

  const resetTimer = () => {
    setTime(0)
    setIsRunning(false)
  }

  const refreshRunner = (runnerId: number) => {
    setRefreshKeys((prev) => ({
      ...prev,
      [runnerId]: prev[runnerId] + 1,
    }))
  }

  const controlVideo = (runnerId: number, command: string) => {
    const iframe = document.querySelector(`iframe[title="Player ${runnerId} Stream"]`) as HTMLIFrameElement
    if (iframe) {
      iframe.contentWindow?.postMessage(`{"event":"command","func":"${command}","args":""}`, "*")
    }
  }

  const muteRunner = (runnerId: number) => {
    const iframe = document.querySelector(`iframe[title="Player ${runnerId} Stream"]`) as HTMLIFrameElement
    if (iframe) {
      iframe.contentWindow?.postMessage('{"event":"command","func":"mute","args":""}', "*")
    }
  }

  const extractYouTubeId = (url: string): string => {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }

    return url // Return as-is if no pattern matches
  }

  const updateRunnerUrl = (runnerId: number, url: string) => {
    const youtubeId = extractYouTubeId(url)
    setRunners((prev) => prev.map((runner) => (runner.id === runnerId ? { ...runner, youtubeId } : runner)))
    // Force refresh the iframe
    setRefreshKeys((prev) => ({
      ...prev,
      [runnerId]: prev[runnerId] + 1,
    }))
  }

  const handleUrlChange = (runnerId: number, url: string) => {
    setTempUrls((prev) => ({ ...prev, [runnerId]: url }))
  }
  const handleNameChange = (runnerId: number, name: string) => {
    setTempNames((prev) => ({ ...prev, [runnerId]: name }))
  }
  const applyUrlChanges = () => {
    Object.entries(tempUrls).forEach(([runnerId, url]) => {
      if (url.trim()) {
        updateRunnerUrl(Number.parseInt(runnerId), url.trim())
      }
    })
    Object.entries(tempNames).forEach(([runnerId, name]) => {
      if (name.trim()) {
        setRunners((prev) =>
          prev.map((runner) => (runner.id === Number.parseInt(runnerId) ? { ...runner, name: name.trim() } : runner)),
        )
      }
    })
    setTempNames({})
    setTempUrls({})
    setEditingUrls(false)
  }

  const cancelUrlChanges = () => {
    setTempUrls({})
    setTempNames({})
    setEditingUrls(false)
  }

  const muteAllRunners = () => {
    runners.forEach((runner) => {
      muteRunner(runner.id)
    })
  }

  const getRunnerBorderColor = (position: string) => {
    return position.includes("left") ? "border-red-500" : "border-white"
  }

  // Get positioning and sizing for each runner based on focus state
  const getRunnerStyles = (runner: Runner) => {
    const isFocused = focusedRunner === runner.id
    const isOtherFocused = focusedRunner !== null && focusedRunner !== runner.id

    if (!focusedRunner) {
      // Normal 2x2 grid positioning
      const gridPositions = {
        "top-left": "top-4 left-4 w-[calc(51%-48px)] h-[calc(51%-24px)] mt-[calc(9%)]",
        "bottom-right": "bottom-4 right-4 w-[calc(51%-48px)] h-[calc(51%-24px)] mb-[calc(18%)]",
      }
      return { className: gridPositions[runner.position], style: {} }
    }

    if (isFocused) {
      // Main focused video - large on the left (100% width)
      return { className: "top-4 left-4 w-[calc(100%-24px)] h-[calc(98%-32px)]", style: {} }
    }

    const otherRunners = runners.filter((r) => r.id !== focusedRunner)
    const thumbnailHeight = 360
    const spacing = 16

    return otherRunners.map((runner, index) => ({
      id: runner.id,
      className: `
        absolute
        bottom-16
        left-16
        z-[9999]
        shadow-2xl rounded-xl border-2 border-white
        bg-black/40 backdrop-blur-sm
        transition-all duration-500 ease-in-out
        w-[21%]
        h-[21%]
      `,
    })).find((r) => r.id === runner.id)!
  }

  return (
    <div className="flex flex-col items-center space-y-4 bg-gray-900 min-h-screen">
      {/* Main Overlay Panel - 1920x1080 */}
      <div className="w-[1920px] h-[1080px] relative overflow-hidden bg-gradient-to-r from-red-900 via-gray-800 to-gray-100 border-4 border-gray-600 rounded-lg">
        {/* RE4 Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://raw.githubusercontent.com/Putra3340/MediaSource/refs/heads/main/img.jpg')",
            filter: "blur(6px)", // you can tweak this value
          }}
        />

        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/30" />

        {!true && (

          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-50">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full z-10 flex items-center justify-center shadow-2xl border-4 border-white">
              <img
                src="https://raw.githubusercontent.com/Putra3340/MediaSource/refs/heads/main/Hitless_ID.png"
                alt=""
                className="w-25 h-25 object-contain rounded-full"
              />
            </div>
          </div>
        )}
        {!focusedRunner && (

          <div className="absolute top-[8%] left-1/2 transform -translate-x-1/2 z-50">
            <div className="w-24 h-24 bg-gradient-to-br rounded-full from-orange-500 to-red-600 z-10 flex items-center justify-center shadow-2xl border-4 border-white">
              <img
                src="https://raw.githubusercontent.com/Putra3340/MediaSource/refs/heads/main/Hitless_ID.png"
                alt=""
                className="w-25 h-25 object-contain rounded-full"
              />
            </div>
          </div>
        )}
        {!focusedRunner && (
        <div className="absolute top-[2%] left-[22%] transform -translate-x-1/2 z-50">
          <div className="w-[45%] h-[45%] z-10 flex items-center justify-center bg-white/10 shadow-2xl border-4 border-black">
            <img
              src="https://raw.githubusercontent.com/Putra3340/MediaSource/refs/heads/main/re4c_sw.webp"
              alt=""
              className="w-[45%] h-[85%] object-contain scale-[2.50] translate-y-[10%] translate-x-[-4%]"
            />
          </div>
        </div>
        )}
        {!focusedRunner && (

          <div className="absolute bottom-28  -translate-y-[-25%] left-1/4 transform z-30 w-[100%] max-w-[1028px]">
            <div className="flex items-center justify-center ">
              <div
                className="font-norwester text-center tracking-wider break-words"
                style={{
                  fontWeight: '800',
                  WebkitTextStroke: '1px black',
                  color: 'white',
                  fontSize: "clamp(1.25rem, 2.5vw, 3rem)",
                  lineHeight: '1.2',
                }}
              >
                <span style={{ color: '#ff0000' }}>
                RE4 Classic Separate Ways Damageless Race
                </span>
                <br />
                <span>Category : New Game Any% (PC)</span>
              </div>
            </div>
          </div>
        )}
        {/* Center Content */}
        {!focusedRunner && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-[55%] -translate-y-[-13%] z-30 w-[90%] max-w-[1600px] overflow-hidden pointer-events-none">
            <div className="flex items-center justify-center shadow-2xl">
              <img
                src="https://github.com/Putra3340/MediaSource/blob/main/long%20text.png?raw=true"
                alt=""
                className="w-[85%]"
              />
            </div>
          </div>
        )}




        {/* Timer - Top Right */}
        <div className="absolute top-6 right-6 z-30">
          <div className="bg-black/80 backdrop-blur-sm rounded-xl p-4 border-4 border-yellow-500 shadow-2xl">
            <div className="text-4xl font-mono font-bold text-white text-center tracking-wider">ㅤㅤㅤㅤㅤㅤ</div>
          </div>
        </div>

        {/* Commentator Bar */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20 bg-black/50 backdrop-blur-sm px-8 py-3 rounded-b-lg">
          <div className="flex space-x-8 text-white text-center">
            <div>
              <p className="font-semibold text-lg">Commentator</p>
              <p className="text-sm text-gray-300">Bg Dap</p>
            </div>
          </div>
        </div>
        {/* Sponsor Running Text Overlay */}
        <div className="absolute bottom-0 left-0 w-full h-12 bg-black/70 backdrop-blur-sm z-20 overflow-hidden border-t-2 border-gray-500">
          <div className="relative w-full h-full flex items-center">
            <div className="absolute whitespace-nowrap text-white text-2xl font-bold animate-marquee">
              {sponsorText}
            </div>
          </div>
        </div>


        {/* Runner Videos - Persistent iframes with dynamic positioning */}
        {runners.map((runner) => {
          const isFocused = focusedRunner === runner.id
          const isOtherFocused = focusedRunner !== null && focusedRunner !== runner.id
          const runnerStyles = getRunnerStyles(runner)

          return (
            <div
              key={runner.id}
              className={`absolute transition-all duration-500 ease-in-out ${runnerStyles.className}`}
              style={{
                zIndex: isFocused ? 10 : 15
              }}
            >
              {/* Rest of the component remains the same */}
              <div
                className={`relative rounded-xl overflow-hidden border-4 cursor-pointer h-full ${getRunnerBorderColor(
                  runner.position,
                )} shadow-lg ${isOtherFocused ? "hover:scale-105" : ""} transition-transform duration-200`}
                onClick={() => handleRunnerClick(runner.id)}
                onContextMenu={(e) => handleRunnerRightClick(e, runner.id)}
              >
                {/* YouTube Embed - Persistent iframe */}
                <div className="w-full h-full bg-black">
                  <iframe
                    key={`iframe-${runner.id}-${refreshKeys[runner.id]}`}
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${runner.youtubeId}?autoplay=1&mute=1&enablejsapi=1&controls=0&disablekb=1&modestbranding=1&rel=0&showinfo=0`}
                    title={`Player ${runner.id} Stream`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>

                {/* Player Name - Dynamic sizing based on focus */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div
                    className={`bg-black/80 backdrop-blur-sm rounded-full border-2 ${isFocused ? "px-6 py-3 border-yellow-400" : "px-4 py-2 border-white"
                      }`}
                  >
                    <h3
                      className={`text-white font-bold text-center ${isFocused ? "text-2xl" : isOtherFocused ? "text-sm" : "text-xl"
                        }`}
                    >
                      {runner.name}
                    </h3>
                    <p
                      className={`text-center mt-1 font-semibold ${isFocused
                          ? "text-yellow-300 text-lg"
                          : isOtherFocused
                            ? "text-gray-300 text-xs"
                            : "text-gray-300 text-sm"
                        }`}
                    >
                      Hits: {runner.hits}
                    </p>
                  </div>
                </div>



              </div>
            </div>
          )
        })}
      </div>

      {/* Control Panel - Separate from main overlay */}
      <div className="w-full bg-gray-800 rounded-lg p-6 border-2 border-gray-600">
        <h2 className="text-white text-xl font-bold mb-4 text-center">Tournament Control Panel</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">


          {/* Hit Controls */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Hit Controls</h3>
            <div className="flex flex-col space-y-2">
              <button
                onClick={resetHits}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
              >
                🔄 Reset All Hits
              </button>
              <div className="text-xs text-gray-300 mt-2">
                <p>• Left click player: Focus/Unfocus</p>
                <p>• Right click player: Add hit</p>
              </div>
            </div>
          </div>
          {/* Audio Controls */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Audio Controls</h3>
            <div className="flex flex-col space-y-2">
              <button
                onClick={muteAllRunners}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold"
              >
                🔇 Mute All
              </button>
              <div className="text-xs text-gray-300 mt-2">
                <p>• Focused player: Auto-unmuted</p>
                <p>• Others: Auto-muted</p>
                <p>• No focus: All muted</p>
              </div>
            </div>
          </div>
          {/* Video Controls */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Video Controls</h3>
            <div className="space-y-3">
              {runners.map((runner) => (
                <div key={runner.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium">{runner.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => controlVideo(runner.id, "playVideo")}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                      title={`Play ${runner.name}`}
                    >
                      ▶️ Play
                    </button>
                    <button
                      onClick={() => controlVideo(runner.id, "pauseVideo")}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                      title={`Pause ${runner.name}`}
                    >
                      ⏸️ Pause
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Network Recovery Controls */}
          <div className="bg-gray-700 rounded-lg p-4">
  <h3 className="text-white font-semibold mb-3">Network Recovery</h3>

  {/* grid for runners */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {runners.map((runner) => (
      <div key={runner.id} className="space-y-2 bg-gray-800 p-3 rounded">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium">
            {runner.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => refreshRunner(runner.id)}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs"
            title={`Refresh ${runner.name} stream`}
          >
            🔄 Refresh
          </button>
          
        </div>
      </div>
    ))}
  </div>
</div>


          {/* YouTube URL Controls */}
          
            {/* Section 1 */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">YouTube URLs (Group 1)</h3>
                <button
                  onClick={() => setEditingUrls(!editingUrls)}
                  className={`px-3 py-1 rounded text-xs font-semibold ${editingUrls
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  {editingUrls ? "Cancel" : "Edit URLs"}
                </button>
              </div>

              {!editingUrls ? (
                <div className="space-y-2">
                  {runners.slice(0, Math.ceil(runners.length / 2)).map((runner) => (
                    <div key={runner.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">
                          {runner.name}
                        </span>
                      </div>
                      <div
                        className="text-xs text-gray-400 truncate"
                        title={runner.youtubeId}
                      >
                        ID: {runner.youtubeId}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {runners.slice(0, Math.ceil(runners.length / 2)).map((runner) => (
                    <div key={runner.id} className="space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="text-white text-xs font-medium block mb-1">
                            Player Name
                          </label>
                          <input
                            type="text"
                            placeholder="Player Name"
                            defaultValue={runner.name}
                            onChange={(e) =>
                              handleNameChange(runner.id, e.target.value)
                            }
                            className="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs border border-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-white text-xs font-medium block mb-1">
                            YouTube URL
                          </label>
                          <input
                            type="text"
                            placeholder="YouTube URL or Video ID"
                            defaultValue={runner.youtubeId}
                            onChange={(e) =>
                              handleUrlChange(runner.id, e.target.value)
                            }
                            className="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs border border-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={applyUrlChanges}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold"
                    >
                      ✅ Apply Changes
                    </button>
                    <button
                      onClick={cancelUrlChanges}
                      className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-semibold"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2 */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">YouTube URLs (Group 2)</h3>
                <button
                  onClick={() => setEditingUrls(!editingUrls)}
                  className={`px-3 py-1 rounded text-xs font-semibold ${editingUrls
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  {editingUrls ? "Cancel" : "Edit URLs"}
                </button>
              </div>

              {!editingUrls ? (
                <div className="space-y-2">
                  {runners.slice(Math.ceil(runners.length / 2)).map((runner) => (
                    <div key={runner.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">
                          {runner.name}
                        </span>
                      </div>
                      <div
                        className="text-xs text-gray-400 truncate"
                        title={runner.youtubeId}
                      >
                        ID: {runner.youtubeId}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {runners.slice(Math.ceil(runners.length / 2)).map((runner) => (
                    <div key={runner.id} className="space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="text-white text-xs font-medium block mb-1">
                            Player Name
                          </label>
                          <input
                            type="text"
                            placeholder="Player Name"
                            defaultValue={runner.name}
                            onChange={(e) =>
                              handleNameChange(runner.id, e.target.value)
                            }
                            className="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs border border-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-white text-xs font-medium block mb-1">
                            YouTube URL
                          </label>
                          <input
                            type="text"
                            placeholder="YouTube URL or Video ID"
                            defaultValue={runner.youtubeId}
                            onChange={(e) =>
                              handleUrlChange(runner.id, e.target.value)
                            }
                            className="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs border border-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={applyUrlChanges}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold"
                    >
                      ✅ Apply Changes
                    </button>
                    <button
                      onClick={cancelUrlChanges}
                      className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-semibold"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          
        </div>

        {/* Status Display */}
        <div className="mt-6 bg-gray-700 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Status & Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-sm text-gray-300 space-y-1">
              <p>Timer: {isRunning ? "🟢 Running" : "🔴 Stopped"}</p>
              <p>Focused: {focusedRunner ? `Player ${focusedRunner}` : "None"}</p>
              <p>Total Hits: {runners.reduce((sum, runner) => sum + runner.hits, 0)}</p>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <p>
                <strong>Audio System:</strong>
              </p>
              <p>• Focused player: 🔊 Unmuted</p>
              <p>• Other players: 🔇 Muted</p>
              <p>• No focus: All muted</p>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <p>
                <strong>Network Recovery:</strong>
              </p>
              <p>• Refresh: Reload video stream completely</p>
              <p>• Fast Forward: Skip ahead to catch up</p>
              <p>• Rewind: Go back if stream is ahead</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
