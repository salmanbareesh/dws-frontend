import { useState, useEffect } from 'react';
import { Search, Mail, Loader2, AlertCircle, Database, Copy, Check } from 'lucide-react';
import { SocialIcon } from './components/SocialIcon';
import { ResultCard } from './components/ResultCard';
import { supabase } from './lib/supabase';

interface ScrapeResult {
  source: string;
  emails: string[];
  socials: {
    [key: string]: string[];
  };
}

interface DomainResult {
  domain: string;
  result: ScrapeResult;
}

interface HistoryItem {
  id: string;
  domain: string;
  emails: string[];
  socials: Record<string, string[]>;
  source: string;
  created_at: string;
}

function App() {
  const [tab, setTab] = useState<'search' | 'saved'>('search');
  const [domains, setDomains] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<DomainResult | null>(null);

  useEffect(() => {
    loadHistory();
    warmupApi();
  }, []);

  const warmupApi = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-domain?domains=example.com`;
      await fetch(apiUrl);
    } catch {
      console.log('API warmup called');
    }
  };

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('scrape_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const saveToDatabase = async (domainResults: DomainResult[]) => {
    try {
      const records = domainResults.map((dr) => ({
        domain: dr.domain,
        emails: dr.result.emails,
        socials: dr.result.socials,
        source: dr.result.source,
      }));

      const { error } = await supabase.from('scrape_results').insert(records);

      if (error) throw error;
      await loadHistory();
    } catch (err) {
      console.error('Failed to save to database:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!domains.trim()) {
      setError('Please enter at least one domain');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const domainList = domains
        .split(/[,\n]+/)
        .map((d) => d.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''))
        .filter((d) => d.length > 0);

      if (domainList.length === 0) {
        setError('Please enter at least one valid domain');
        setLoading(false);
        return;
      }

      const domainsString = domainList.join(',');
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-domain?domains=${encodeURIComponent(domainsString)}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();

      const domainResults: DomainResult[] = Array.isArray(data)
        ? data.map((item: any, index: number) => ({
            domain: domainList[index] || item.domain || 'Unknown',
            result: item,
          }))
        : [
            {
              domain: domainList[0],
              result: data,
            },
          ];

      setResults(domainResults);
      await saveToDatabase(domainResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-2xl">
              <Search className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Domain Contact Finder
          </h1>
          <p className="text-slate-600 text-lg">
            Extract emails and social media links from any website
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => {
              setTab('search');
              setSelectedResult(null);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              tab === 'search'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-50 shadow-md'
            }`}
          >
            <Search className="w-5 h-5" />
            Search
          </button>
          <button
            onClick={() => setTab('saved')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              tab === 'saved'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-50 shadow-md'
            }`}
          >
            <Database className="w-5 h-5" />
            Saved Data {history.length > 0 && <span className="ml-1 bg-slate-200 text-slate-900 px-2 py-0.5 rounded text-sm">{history.length}</span>}
          </button>
        </div>

        {tab === 'search' && (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="domains" className="block text-sm font-medium text-slate-700 mb-2">
                Website Domains
              </label>
              <textarea
                id="domains"
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                placeholder="example.com&#10;domain.io&#10;site.co"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                rows={4}
                disabled={loading}
              />
              <p className="mt-2 text-sm text-slate-500">
                Enter domains separated by commas or new lines. Example: example.com, domain.io, site.co
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Find Contacts
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>
        )}

        {tab === 'search' && results.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Results ({results.length})</h2>
              <div className="grid gap-6">
                {results.map((domainResult, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center gap-2 mb-6 pb-6 border-b border-slate-200">
                      <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                      <h3 className="text-lg font-semibold text-slate-900">{domainResult.domain}</h3>
                      <div className="h-1 w-1 rounded-full bg-slate-400 mx-2"></div>
                      <span className="text-sm font-medium text-slate-600">
                        Source: <span className="text-slate-900">{domainResult.result.source}</span>
                      </span>
                    </div>

                    <ResultCard
                      title="Email Addresses"
                      icon={<Mail className="w-5 h-5" />}
                      items={domainResult.result.emails}
                      emptyMessage="No email addresses found"
                      renderItem={(email) => (
                        <a
                          href={`mailto:${email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {email}
                        </a>
                      )}
                    />

                    <div className="mt-8">
                      <ResultCard
                        title="Social Media Links"
                        icon={<SocialIcon platform="social" />}
                        items={Object.entries(domainResult.result.socials).flatMap(([platform, links]) =>
                          links.map((link) => ({ platform, link }))
                        )}
                        emptyMessage="No social media links found"
                        renderItem={({ platform, link }) => (
                          <div className="flex items-center gap-3">
                            <SocialIcon platform={platform} />
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex-1 truncate"
                            >
                              {link}
                            </a>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'saved' && (
          <div>
            {selectedResult ? (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
                >
                  <span>←</span> Back to Saved Data
                </button>
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="flex items-center gap-2 mb-6 pb-6 border-b border-slate-200">
                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                    <h3 className="text-lg font-semibold text-slate-900">{selectedResult.domain}</h3>
                    <div className="h-1 w-1 rounded-full bg-slate-400 mx-2"></div>
                    <span className="text-sm font-medium text-slate-600">
                      Source: <span className="text-slate-900">{selectedResult.result.source}</span>
                    </span>
                  </div>

                  <ResultCard
                    title="Email Addresses"
                    icon={<Mail className="w-5 h-5" />}
                    items={selectedResult.result.emails}
                    emptyMessage="No email addresses found"
                    renderItem={(email) => (
                      <a
                        href={`mailto:${email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {email}
                      </a>
                    )}
                  />

                  <div className="mt-8">
                    <ResultCard
                      title="Social Media Links"
                      icon={<SocialIcon platform="social" />}
                      items={Object.entries(selectedResult.result.socials).flatMap(([platform, links]) =>
                        links.map((link) => ({ platform, link }))
                      )}
                      emptyMessage="No social media links found"
                      renderItem={({ platform, link }) => (
                        <div className="flex items-center gap-3">
                          <SocialIcon platform={platform} />
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex-1 truncate"
                          >
                            {link}
                          </a>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                {history.length > 0 ? (
                  <>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Saved Results</h2>
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          onClick={() =>
                            setSelectedResult({
                              domain: item.domain,
                              result: {
                                source: item.source,
                                emails: item.emails,
                                socials: item.socials,
                              },
                            })
                          }
                          className="p-4 bg-slate-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors border border-transparent hover:border-blue-200"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 break-all hover:text-blue-600">{item.domain}</p>
                              <p className="text-sm text-slate-600 mt-1">
                                {item.emails.length} email{item.emails.length !== 1 ? 's' : ''} • {Object.values(item.socials).flat().length} social link{Object.values(item.socials).flat().length !== 1 ? 's' : ''}
                              </p>
                              <p className="text-xs text-slate-500 mt-2">
                                {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No saved results yet. Start a search to save results!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
