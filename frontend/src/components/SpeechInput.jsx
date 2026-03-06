import { useState, useRef, useEffect } from 'react';
import { FiMic, FiMicOff } from 'react-icons/fi';
import './SpeechInput.css';

const SpeechInput = ({ onTranscript, disabled }) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [liveText, setLiveText] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      if (final) onTranscript(final);
      setLiveText(interim);
    };

    recognition.onend = () => {
      setListening(false);
      setLiveText('');
    };

    recognition.onerror = () => {
      setListening(false);
      setLiveText('');
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  if (!supported) {
    return (
      <p className="speech-unsupported">
        Speech recognition not supported in this browser. Please type your answer.
      </p>
    );
  }

  return (
    <div className="speech-input">
      <button
        type="button"
        className={`speech-btn ${listening ? 'listening' : ''}`}
        onClick={toggleListening}
        disabled={disabled}
        aria-label={listening ? 'Stop recording' : 'Start recording'}
      >
        {listening ? <FiMicOff size={18} /> : <FiMic size={18} />}
        <span>{listening ? 'Stop Recording' : 'Record Answer'}</span>
        {listening && <span className="pulse-dot" />}
      </button>
      {liveText && (
        <div className="speech-live-text">
          <span className="live-label">Listening…</span>
          <span>{liveText}</span>
        </div>
      )}
    </div>
  );
};

export default SpeechInput;
