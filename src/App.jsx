import { useEffect, useState, useRef } from 'react';
import './App.css';
import { URL } from './constants';
import RecentSearch from './components/RecentSearch';
import QuestionAnswer from './components/QuestionAnswer';

function App() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState([]);
  const [recentHistory, setRecentHistory] = useState(JSON.parse(localStorage.getItem('history')));
  const [selectedHistory, setSelectedHistory] = useState('');
  const scrollToAns = useRef();
  const [loader, setLoader] = useState(false);
  const [listening, setListening] = useState(false); // 🎙️ to track voice input status

  // 🎤 Speech Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
    };
  }

  // 🔊 Text-to-Speech Function
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = 1;
      utter.pitch = 1;
      synth.speak(utter);
    }
  };

  const askQuestion = async () => {
    if (!question && !selectedHistory) return false;

    if (question) {
      let history = JSON.parse(localStorage.getItem('history')) || [];
      history = [question, ...history];
      localStorage.setItem('history', JSON.stringify(history));
      setRecentHistory(history);
    }

    const payloadData = question || selectedHistory;
    const payLoad = {
      contents: [{ parts: [{ text: payloadData }] }],
    };
    setLoader(true);

    let response = await fetch(URL, {
      method: 'POST',
      body: JSON.stringify(payLoad),
    });

    response = await response.json();
    let dataString = response.candidates[0].content.parts[0].text;
    dataString = dataString.split('* ').map((item) => item.trim());

    // ✅ Speak AI response out loud
    const fullResponse = dataString.join(' ');
    speakText(fullResponse);

    setResult([
      ...result,
      { type: 'q', text: question || selectedHistory },
      { type: 'a', text: dataString },
    ]);

    setQuestion('');
    setTimeout(() => {
      scrollToAns.current.scrollTop = scrollToAns.current.scrollHeight;
    }, 500);
    setLoader(false);
  };

  const isEnter = (event) => {
    if (event.key === 'Enter') askQuestion();
  };

  useEffect(() => {
    askQuestion();
  }, [selectedHistory]);

  // ✅ Dark Mode Logic (Persistent)
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') || 'dark');
  useEffect(() => {
    localStorage.setItem('theme', darkMode);
    document.documentElement.classList.toggle('dark', darkMode === 'dark');
  }, [darkMode]);

  return (
    <div className={`h-screen ${darkMode === 'dark' ? 'dark bg-zinc-900 text-white' : 'light bg-yellow-100 text-zinc-800'}`}>
      <div className='grid grid-cols-5 h-full text-center'>

        {/* Theme Toggle */}
        <select
          onChange={(e) => setDarkMode(e.target.value)}
          value={darkMode}
          className='fixed bottom-4 left-4 bg-zinc-800 text-white dark:bg-zinc-700 p-2 rounded-md border border-gray-500'
        >
          <option value='dark'>Dark</option>
          <option value='light'>Light</option>
        </select>

        {/* Sidebar */}
        <RecentSearch
          recentHistory={recentHistory}
          setRecentHistory={setRecentHistory}
          setSelectedHistory={setSelectedHistory}
        />

        {/* Chat Section */}
        <div className='col-span-4 p-10'>
          <h1 className='text-4xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-700 to-violet-700'>
            Hello User, Ask me Anything
          </h1>

          {/* Loader */}
          {loader && (
            <div role='status'>
              <svg
                aria-hidden='true'
                className='inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-purple-600'
                viewBox='0 0 100 101'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 
                  0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 
                  0.59082C77.6142 0.59082 100 22.9766 100 50.5908Z'
                  fill='currentColor'
                />
                <path
                  d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 
                  33.5539C95.2932 28.8227 92.871 24.3692 89.8167 
                  20.348C85.8452 15.1192 80.8826 10.7238 
                  75.2124 7.41289C69.5422 4.10194 63.2754 
                  1.94025 56.7698 1.05124C51.7666 0.367541 
                  46.6976 0.446843 41.7345 1.27873C39.2613 
                  1.69328 37.813 4.19778 38.4501 
                  6.62326C39.0873 9.04874 41.5694 
                  10.4717 44.0505 10.1071Z'
                  fill='currentFill'
                />
              </svg>
            </div>
          )}

          {/* Chat Messages */}
          <div ref={scrollToAns} className='overflow-y-auto pb-24 h-[calc(100vh-14rem)]'>
            <div className={`${darkMode === 'dark' ? 'text-zinc-300' : 'text-zinc-800'}`}>
              <ul>
                {result.map((item, index) => (
                  <QuestionAnswer key={index} item={item} index={index} />
                ))}
              </ul>
            </div>
          </div>

          {/* Input Area */}
          <div
            className={`w-1/2 p-1 pr-5 mx-auto mt-10 rounded-4xl border h-16 flex justify-between items-center 
            ${darkMode === 'dark' 
              ? 'bg-zinc-800 text-white border-zinc-700' 
              : 'bg-pink-100 text-zinc-800 border-pink-300'
            }`}
          >
            <input
              type='text'
              value={question}
              onKeyDown={isEnter}
              onChange={(e) => setQuestion(e.target.value)}
              className='w-full h-full p-3 bg-transparent outline-none'
              placeholder='Ask me anything'
            />

 <button
  onClick={() => recognition && recognition.start()}
  className={`mr-3 p-2 rounded-full border transition-all duration-300 ${
    listening 
      ? 'bg-purple-700 border-purple-400 text-white scale-110' 
      : 'border-zinc-600 hover:border-purple-400'
  }`}
  title='Start Voice Input'
>
  <svg xmlns="http://www.w3.org/2000/svg" 
       fill="none" viewBox="0 0 24 24" 
       strokeWidth="1.5" stroke="currentColor" 
       className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" 
          d="M12 18.75a6.75 6.75 0 006.75-6.75M12 18.75A6.75 6.75 0 015.25 12M12 18.75v2.25m0-20.25v7.5a2.25 2.25 0 004.5 0v-7.5M9 12h6"/>
  </svg>
</button>




            <button onClick={askQuestion}>Ask</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
