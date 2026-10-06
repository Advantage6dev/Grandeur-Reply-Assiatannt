import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { generateReply, type ReplyResult } from '../api/generateReply';
import './replyPage.css';

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

type ReplyPageProps = {
  demo?: boolean;
};

export default function ReplyPage({ demo = false }: ReplyPageProps) {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [summary, setSummary] = useState<Pick<
    ReplyResult,
    'itemsFound' | 'total'
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [replyError, setReplyError] = useState('');
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  function fitReplyBox() {
    const box = replyRef.current;
    if (!box) return;

    // on laptops the box fills the card, so remove any fixed height
    if (window.matchMedia('(min-width: 900px)').matches) {
      box.style.height = '';
      return;
    }

    // on phones, shrink first and then grow to the text's real height
    box.style.height = 'auto';
    box.style.height = `${box.scrollHeight}px`;
  }

  // runs every time the reply text changes (generated or edited)
  useLayoutEffect(() => {
    fitReplyBox();
  }, [reply]);

  // runs when the screen is resized or rotated
  useEffect(() => {
    window.addEventListener('resize', fitReplyBox);
    return () => window.removeEventListener('resize', fitReplyBox);
  }, []);

  async function handleGenerate() {
    if (!message.trim()) {
      setMessageError('Paste the customer\u2019s message first.');
      return;
    }
    setMessageError('');
    setReplyError('');
    setLoading(true);
    try {
      const result = await generateReply(message.trim());
      setReply(result.reply);
      setSummary({ itemsFound: result.itemsFound, total: result.total });
    } catch {
      setMessageError('Couldn\u2019t generate a reply. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!reply.trim()) {
      setReplyError('Generate a reply first.');
      return;
    }
    setReplyError('');
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setReplyError('Couldn\u2019t copy. Select the text and copy it by hand.');
    }
  }

  function handleClear() {
    setMessage('');
    setReply('');
    setSummary(null);
    setMessageError('');
    setReplyError('');
    setCopied(false);
  }

  return (
    <main className='reply'>
      {demo && (
        <p className='reply__demo'>Demo mode: sample products and prices</p>
      )}

      <section className='panel ' aria-labelledby='message-title'>
        <h2 id='message-title' className='panel__title'>
          Customer&rsquo;s message
        </h2>

        <textarea
          className='panel__text'
          aria-labelledby='message-title'
          placeholder="Paste the customer's message here"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setMessageError('');
          }}
        />

        {messageError && (
          <p className='panel__error' role='alert'>
            {messageError}
          </p>
        )}

        <div className='panel__actions'>
          <button
            type='button'
            className='rbtn rbtn--primary'
            onClick={handleGenerate}
            aria-busy={loading}
          >
            {loading ? 'Generating\u2026' : 'Generate reply'}
          </button>
          <button type='button' className='rlink' onClick={handleClear}>
            Clear
          </button>
        </div>

        <p className='panel__hint'>
          Paste a message from WhatsApp or Instagram.
        </p>
      </section>

      <section className='panel panel--reply' aria-labelledby='reply-title'>
        <div className='panel__head'>
          <h2 id='reply-title' className='panel__title'>
            Reply
          </h2>
          <span className='panel__hint'>You can edit this before copying</span>
        </div>

        <textarea
          ref={replyRef}
          className='panel__text'
          aria-labelledby='reply-title'
          placeholder='Your reply will show here'
          value={reply}
          onChange={(e) => {
            setReply(e.target.value);
            setReplyError('');
          }}
        />

        {summary && (
          <div className='summary'>
            <span>
              {summary.itemsFound} items found in catalog, delivery fee added
            </span>
            <strong>{naira.format(summary.total)}</strong>
          </div>
        )}

        {replyError && (
          <p className='panel__error' role='alert'>
            {replyError}
          </p>
        )}

        <div className='panel__actions'>
          <button
            type='button'
            className='rbtn rbtn--primary'
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy reply'}
          </button>
          <button
            type='button'
            className='rbtn rbtn--outline'
            onClick={handleGenerate}
          >
            Try again
          </button>
        </div>

        <p className='reply__sr' aria-live='polite'>
          {copied ? 'Reply copied to clipboard' : ''}
        </p>
      </section>
    </main>
  );
}
