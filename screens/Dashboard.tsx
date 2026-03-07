
import React, { useState, useRef, useMemo } from 'react';
import { UserProfile, DashboardTab, Order, ReturnItem, ScheduledPost, ProductPerformance } from '../types';
import { generateProductDescription, performPriceAnalysis, enhanceProductImage } from '../services/geminiService';

interface Props {
  user: UserProfile | null;
  language: string;
  onLogout: () => void;
}

// Mock Data
const initialMockOrders: Order[] = [
  { id: 'ORD001', productName: 'Blue Ceramic Mug', quantity: 2, buyerAddress: '123 Tech Lane, Bangalore, KA', platform: 'Amazon', status: 'Shipped', timestamp: '2023-10-27 10:30' },
  { id: 'ORD002', productName: 'Silk Scarf', quantity: 1, buyerAddress: '456 Rose Gdns, Mumbai, MH', platform: 'Myntra', status: 'Processing', timestamp: '2023-10-27 11:15' },
  { id: 'ORD003', productName: 'Handmade Soap', quantity: 5, buyerAddress: '789 Ocean Dr, Goa', platform: 'Etsy', status: 'Delivered', timestamp: '2023-10-26 14:00' },
];

const initialMockPerformance: (ProductPerformance & { inStock: boolean })[] = [
  { productName: 'Blue Ceramic Mug', sales: 124, reviews: 45, rating: 4.8, returns: 2, cancellations: 1, inStock: true },
  { productName: 'Handmade Soap', sales: 89, reviews: 20, rating: 4.5, returns: 0, cancellations: 3, inStock: true },
  { productName: 'Silk Scarf', sales: 45, reviews: 12, rating: 4.2, returns: 5, cancellations: 2, inStock: false },
];

const mockReturns: ReturnItem[] = [
  { id: 'RET001', orderId: 'ORD005', productName: 'Cotton T-Shirt', reason: 'Wrong Size', status: 'Approved' },
];

const mockScheduled: ScheduledPost[] = [
  { id: 'SCH001', productName: 'Winter Candle Collection', platform: 'Flipkart', scheduledTime: '2023-11-01 09:00' },
];

const platforms = [
  { id: 'amazon', name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Amazon_icon.svg/512px-Amazon_icon.svg.png' },
  { id: 'flipkart', name: 'Flipkart', logo: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/flipkart-icon.png' },
  { id: 'myntra', name: 'Myntra', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png' },
  { id: 'meesho', name: 'Meesho', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Meesho_Logo_Full.png/512px-Meesho_Logo_Full.png' },
  { id: 'ajio', name: 'Ajio', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Ajio_Logo.svg/512px-Ajio_Logo.svg.png' },
  { id: 'etsy', name: 'Etsy', logo: 'https://cdn-icons-png.flaticon.com/512/825/825528.png' },
];

const Dashboard: React.FC<Props> = ({ user, language, onLogout }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('publish');
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [speechText, setSpeechText] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ desc?: string, price?: { text: string, links: any[] } } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterByProduct, setFilterByProduct] = useState<string | null>(null);
  
  const [inventory, setInventory] = useState(initialMockPerformance);
  
  const recognitionRef = useRef<any>(null);

  const filteredOrders = useMemo(() => {
    if (!filterByProduct) return initialMockOrders;
    return initialMockOrders.filter(o => o.productName === filterByProduct);
  }, [filterByProduct]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string].slice(-5));
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleStock = (productName: string) => {
    setInventory(prev => prev.map(item => 
      item.productName === productName ? { ...item, inStock: !item.inStock } : item
    ));
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported.");
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'Hindi' ? 'hi-IN' : 'en-US';
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      setSpeechText(prev => (prev + ' ' + event.results[0][0].transcript).trim());
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
  };

  const onFullAnalysis = async () => {
    if (!speechText || !basePrice) return alert("Details missing.");
    setLoading(true);
    try {
      const [desc, priceAnalysis] = await Promise.all([
        generateProductDescription(speechText, images, language),
        performPriceAnalysis(speechText, "Retail", basePrice)
      ]);
      setResult({ desc, price: priceAnalysis });
    } finally { setLoading(false); }
  };

  const handleConfirmPublish = () => {
    if (selectedPlatforms.length === 0) {
      alert("Please select at least one platform.");
      return;
    }
    alert(`Successfully published product on: ${selectedPlatforms.join(', ')}`);
    // Reset state
    setImages([]);
    setSpeechText('');
    setBasePrice('');
    setResult(null);
    setSelectedPlatforms([]);
    setIsPlatformModalOpen(false);
  };

  const renderPublish = () => (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-300">Product Images</label>
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="group relative w-20 h-20 rounded-xl overflow-hidden border border-white/20">
              <img src={img} className="w-full h-full object-cover" />
              <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 text-[10px]">&times;</button>
            </div>
          ))}
          {images.length < 5 && (
            <label className="w-20 h-20 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-[#00e5ff]/50 transition-colors">
              <input type="file" hidden multiple onChange={handleImageUpload} />
              <span className="text-xl">+</span>
            </label>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-300">Description Notes</label>
        <div className="relative">
          <textarea 
            value={speechText} 
            onChange={(e) => setSpeechText(e.target.value)} 
            placeholder="Tell us about your product (or use voice)..." 
            className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 h-32 text-sm outline-none focus:border-[#7c4dff] text-white transition-all" 
          />
          <button onClick={startVoice} className={`absolute bottom-4 right-4 p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#7c4dff] hover:scale-110'}`}>🎙️</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="block text-sm font-semibold text-gray-300">Listing Price</label>
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00e5ff] font-bold">₹</span>
              <input 
                type="number" 
                value={basePrice} 
                onChange={(e) => setBasePrice(e.target.value)} 
                placeholder="Enter Base Price" 
                className="w-full p-4 pl-8 bg-white/5 rounded-2xl border border-white/10 text-white outline-none focus:border-[#7c4dff] transition-all" 
              />
            </div>
            <button 
              onClick={onFullAnalysis} 
              disabled={loading || !basePrice || !speechText}
              className="px-6 py-4 bg-[#7c4dff]/20 text-[#00e5ff] border border-[#00e5ff]/20 text-xs font-bold rounded-2xl hover:bg-[#7c4dff]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Analyze Market'}
            </button>
          </div>
        </div>

        {/* Proceed Option Below Base Price */}
        <button 
          onClick={() => setIsPlatformModalOpen(true)}
          disabled={!basePrice || !speechText}
          className="w-full py-4 bg-gradient-to-r from-[#7c4dff] to-[#00e5ff] rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#7c4dff]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
        >
          Proceed to Marketplace
        </button>
      </div>

      {result && (
        <div className="p-4 bg-white/5 rounded-2xl border border-[#00e5ff]/20 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✨</span>
            <h4 className="font-bold text-[#00e5ff] text-sm uppercase tracking-tighter">AI Optimized Content</h4>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar italic">{result.desc}</p>
        </div>
      )}

      {/* Platform Selection Modal */}
      {isPlatformModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsPlatformModalOpen(false)}></div>
          <div className="relative glass-card w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 animate-in zoom-in-90 duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-white leading-tight">Publish to<br/>Marketplaces</h3>
              </div>
              <button onClick={() => setIsPlatformModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">&times;</button>
            </div>
            
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Connected Channels</p>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
              {platforms.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => setSelectedPlatforms(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} 
                  className={`relative p-5 rounded-[2rem] border transition-all flex flex-col items-center gap-3 group overflow-hidden ${selectedPlatforms.includes(p.id) ? 'border-[#00e5ff] bg-[#00e5ff]/5' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                >
                  <div className={`w-14 h-14 rounded-full p-2 flex items-center justify-center transition-transform duration-500 ${selectedPlatforms.includes(p.id) ? 'bg-white scale-110' : 'bg-white/90 grayscale group-hover:grayscale-0'}`}>
                    <img src={p.logo} alt={p.name} className="w-full h-full object-contain" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPlatforms.includes(p.id) ? 'text-[#00e5ff]' : 'text-gray-500'}`}>{p.name}</span>
                  {selectedPlatforms.includes(p.id) && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-[#00e5ff] rounded-full flex items-center justify-center text-[10px] text-black font-bold animate-in zoom-in">✓</div>
                  )}
                </button>
              ))}
            </div>

            <button 
              onClick={handleConfirmPublish}
              disabled={selectedPlatforms.length === 0}
              className="w-full py-5 bg-[#00e5ff] text-black font-black rounded-2xl hover:bg-white transition-all uppercase tracking-widest text-sm disabled:opacity-30 shadow-lg shadow-[#00e5ff]/10"
            >
              Publish Now
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-4 pb-20 animate-in fade-in duration-500">
      <h3 className="text-lg font-bold">Your Active Inventory</h3>
      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Click a product to view its shipping destinations</p>
      {inventory.map((item, i) => (
        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-3 group hover:border-[#7c4dff]/30 transition-all">
          <div className="flex justify-between items-center">
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => {
                setFilterByProduct(item.productName);
                setActiveTab('orders');
              }}
            >
              <p className="font-bold text-sm group-hover:text-[#00e5ff] transition-colors">{item.productName}</p>
              <p className="text-[10px] text-gray-500">Sales: {item.sales} | Rating: {item.rating}★</p>
            </div>
            
            {/* Stock Toggle */}
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold uppercase ${item.inStock ? 'text-green-400' : 'text-red-400'}`}>
                {item.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleStock(item.productName); }}
                className={`w-10 h-5 rounded-full relative transition-all ${item.inStock ? 'bg-green-500/30' : 'bg-red-500/30'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${item.inStock ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
           {filterByProduct && (
             <button onClick={() => setFilterByProduct(null)} className="p-1 bg-white/10 rounded-full text-[10px] hover:bg-white/20">✕</button>
           )}
           <h3 className="text-lg font-bold">
             {filterByProduct ? `Orders for: ${filterByProduct}` : 'Recent Orders'}
           </h3>
        </div>
        <span className="text-[10px] text-gray-500 italic">Auto-refresh (50m)</span>
      </div>
      
      {selectedOrder ? (
        <div className="p-5 bg-white/5 border border-[#00e5ff]/30 rounded-2xl space-y-4 animate-in zoom-in-95">
          <button onClick={() => setSelectedOrder(null)} className="text-xs text-[#00e5ff] font-bold">← Back to Orders</button>
          
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-lg leading-tight">{selectedOrder.productName}<br/><span className="text-xs text-gray-500 font-normal">Order ID: {selectedOrder.id}</span></h4>
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-bold uppercase text-gray-500">Available</span>
               {(() => {
                 const invItem = inventory.find(inv => inv.productName === selectedOrder.productName);
                 return (
                   <button 
                     onClick={() => toggleStock(selectedOrder.productName)}
                     className={`text-[9px] font-bold px-3 py-1 rounded-full mt-1 border transition-all ${invItem?.inStock ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}
                   >
                     {invItem?.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                   </button>
                 );
               })()}
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <label className="text-[10px] font-bold uppercase text-[#00e5ff] block mb-2 tracking-widest">Shipping Destination</label>
            <p className="text-sm text-gray-300 leading-relaxed font-medium">{selectedOrder.buyerAddress}</p>
          </div>

          <div className="pt-4 border-t border-white/5">
            <label className="text-[10px] font-bold uppercase text-gray-500 block mb-4 tracking-widest">Live Progress</label>
            <div className="space-y-4 pl-4 relative">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/10"></div>
              {[
                { s: 'Order Confirmed', t: '10:30 AM', active: true },
                { s: 'Packed & Processed', t: '12:15 PM', active: selectedOrder.status !== 'Processing' },
                { s: 'Handed to Courier', t: 'Pending', active: selectedOrder.status === 'Shipped' || selectedOrder.status === 'Delivered' },
                { s: 'Out for Delivery', t: 'Pending', active: selectedOrder.status === 'Delivered' }
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 relative">
                  <div className={`w-3 h-3 rounded-full border-2 z-10 transition-all duration-700 ${step.active ? 'bg-[#00e5ff] border-[#00e5ff] shadow-[0_0_10px_#00e5ff]' : 'bg-black border-white/20'}`}></div>
                  <div>
                    <p className={`text-xs ${step.active ? 'text-white font-bold' : 'text-gray-600'}`}>{step.s}</p>
                    <p className="text-[10px] text-gray-700">{step.t}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="py-20 text-center text-gray-600 text-sm italic">No records found.</div>
          ) : (
            filteredOrders.map(o => (
              <button 
                key={o.id} 
                onClick={() => setSelectedOrder(o)} 
                className="w-full p-4 bg-white/5 rounded-2xl border border-white/5 text-left hover:border-[#00e5ff]/40 transition-all group"
              >
                <div className="flex justify-between text-[10px] mb-2">
                  <span className="text-[#00e5ff] font-black">{o.id}</span>
                  <span className="text-gray-500">{o.timestamp}</span>
                </div>
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold group-hover:text-white transition-colors">{o.productName}</p>
                  {(() => {
                    const item = inventory.find(i => i.productName === o.productName);
                    return <div className={`w-2 h-2 rounded-full shadow-sm ${item?.inStock ? 'bg-green-400' : 'bg-red-400'}`} title={item?.inStock ? 'In Stock' : 'Out of Stock'}></div>;
                  })()}
                </div>
                <p className="text-[10px] text-gray-500 mt-2 truncate opacity-70">To: {o.buyerAddress}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[9px] px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-gray-400 font-black uppercase tracking-widest">{o.platform}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#7c4dff] uppercase tracking-wider">{o.status}</span>
                    <span className="text-[#00e5ff] text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('profile')} className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 text-white transition-colors">←</button>
        <h3 className="text-lg font-bold">Business Analytics</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
          <p className="text-[10px] text-gray-500 uppercase font-black mb-1 tracking-widest">Total Orders</p>
          <p className="text-2xl font-black text-[#00e5ff]">{inventory.reduce((acc, curr) => acc + curr.sales, 0)}</p>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
          <p className="text-[10px] text-gray-500 uppercase font-black mb-1 tracking-widest">Shop Rating</p>
          <p className="text-2xl font-black text-yellow-400">
            {(inventory.reduce((acc, curr) => acc + curr.rating, 0) / inventory.length).toFixed(1)}★
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Performance Details</h4>
        {inventory.map((item, i) => (
          <div key={i} className="p-5 bg-white/5 rounded-3xl border border-white/10 space-y-4 hover:border-white/20 transition-all">
            <div className="flex justify-between items-center">
              <h5 className="font-bold text-sm">{item.productName}</h5>
              <span className="text-[10px] font-black text-[#7c4dff] bg-[#7c4dff]/10 border border-[#7c4dff]/20 px-2 py-1 rounded-lg">{item.rating} ★</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                   <span className="text-gray-500">Orders</span>
                   <span className="text-white">{item.sales}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00e5ff] shadow-[0_0_5px_#00e5ff]" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                   <span className="text-gray-500">Reviews</span>
                   <span className="text-white">{item.reviews}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#7c4dff] shadow-[0_0_5px_#7c4dff]" style={{ width: '60%' }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                   <span className="text-gray-500">Returns</span>
                   <span className={`font-black ${item.returns > 3 ? 'text-red-500' : 'text-white'}`}>{item.returns}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${item.returns > 3 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${(item.returns / (item.sales || 1)) * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                   <span className="text-gray-500">Cancelled</span>
                   <span className={`font-black ${item.cancellations > 2 ? 'text-red-500' : 'text-white'}`}>{item.cancellations}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${item.cancellations > 2 ? 'bg-red-500' : 'bg-gray-500'}`} style={{ width: `${(item.cancellations / (item.sales || 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-5 p-6 bg-white/5 rounded-[2rem] border border-white/5">
        <div className="relative">
          <img src={`https://ui-avatars.com/api/?name=${user?.name || 'George'}&background=7c4dff&color=fff&size=128`} className="w-20 h-20 rounded-full border-2 border-[#00e5ff] shadow-lg shadow-[#00e5ff]/10" />
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-[#050508] rounded-full"></div>
        </div>
        <div>
          <h3 className="font-black text-xl text-white tracking-tight">{user?.name || 'George'}</h3>
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{user?.shopName || "George's Artisan Hub"}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: '📅', label: 'Scheduling', count: mockScheduled.length },
          { icon: '🔄', label: 'Returns', count: mockReturns.length },
          { icon: '📈', label: 'Performance', onClick: () => setActiveTab('performance') },
          { icon: '🛡️', label: 'Support', link: '#' }
        ].map((item, i) => (
          <button 
            key={i} 
            onClick={item.onClick}
            className="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 hover:border-white/20 hover:scale-[1.03] transition-all group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="text-[10px] font-black uppercase text-white tracking-widest">{item.label}</span>
            {item.count !== undefined && <span className="text-[10px] text-gray-500 font-bold">{item.count} Active</span>}
          </button>
        ))}
      </div>

      <div className="p-6 bg-gradient-to-br from-[#7c4dff]/20 to-[#00e5ff]/20 rounded-[2rem] border border-white/10">
        <p className="text-sm font-black mb-1 text-white uppercase tracking-tight">Need Expert Help?</p>
        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">Book a 1-1 priority consultation session with our growth experts.</p>
        <button className="w-full py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#00e5ff] transition-all">Book Now</button>
      </div>

      <button onClick={onLogout} className="w-full py-5 bg-red-500/5 text-red-500 font-black border border-red-500/10 rounded-[2rem] mt-4 hover:bg-red-500/10 transition-all uppercase tracking-[0.2em] text-[10px]">Sign Out</button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'publish': return renderPublish();
      case 'products': return renderProducts();
      case 'orders': return renderOrders();
      case 'profile': return renderProfile();
      case 'performance': return renderPerformance();
      default: return renderPublish();
    }
  };

  return (
    <div className="glass-card p-6 rounded-[2.5rem] w-full max-h-[95vh] flex flex-col overflow-hidden relative border-white/5">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8 px-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tighter">
            <span className="text-[#00e5ff] animate-pulse">👋</span> {
              activeTab === 'publish' ? `Hello, ${user?.name || 'George'}` : 
              activeTab === 'performance' ? 'Analytics' : 
              activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
            }
          </h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">{user?.shopName || "George's Artisan Hub"}</p>
        </div>
        <button 
          onClick={() => setActiveTab('profile')} 
          className={`w-12 h-12 rounded-full border-2 overflow-hidden hover:scale-110 active:scale-95 transition-all shadow-lg ${activeTab === 'profile' ? 'border-[#00e5ff] shadow-[#00e5ff]/20' : 'border-white/10'}`}
        >
          <img src={`https://ui-avatars.com/api/?name=${user?.name || 'George'}&background=7c4dff&color=fff`} alt="Profile" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="mt-4 px-2 pb-2">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 flex justify-around items-center p-3 rounded-[2rem]">
          {[
            { id: 'publish', icon: '✨', label: 'Publish' },
            { id: 'products', icon: '📦', label: 'Products' },
            { id: 'orders', icon: '🚚', label: 'Orders' },
            { id: 'profile', icon: '👤', label: 'Profile' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => {
                setActiveTab(tab.id as DashboardTab);
                if (tab.id !== 'orders') {
                  setSelectedOrder(null);
                  setFilterByProduct(null);
                }
              }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 relative group ${activeTab === tab.id ? 'bg-[#7c4dff]/20 text-white scale-105' : 'text-gray-500 opacity-60 hover:opacity-100'}`}
            >
              <span className={`text-xl transition-transform duration-300 ${activeTab === tab.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]' : 'group-hover:scale-110'}`}>{tab.icon}</span>
              <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-[#00e5ff] scale-105' : ''}`}>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute -bottom-1 w-1 h-1 bg-[#00e5ff] rounded-full shadow-[0_0_8px_#00e5ff]"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
