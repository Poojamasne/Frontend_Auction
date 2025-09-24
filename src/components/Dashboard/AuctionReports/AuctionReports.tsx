import React, { useState, useEffect } from 'react';
import './AuctionReports.css';
import ReportService, { AuctionReport, AuctionBidSummary } from '../../../services/reportService';
import { format } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';

interface BaseAuction {
  id: string;
  auctionNo: string;
  title: string;
  auctionDetails: string;
  auctionDate: string;
  auctionStartTime: string;
  duration?: number;
  openToAllCompanies: boolean;
  currency: string;
  decrementalValue?: string;
}

interface AuctionParticipant {
  id: string;
  userId: string;
  companyName: string;
  preBidOffer?: number;
  finalBid?: number;
  rank?: string;
}

const AuctionReports: React.FC = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<BaseAuction[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<BaseAuction | null>(null);
  const [participants, setParticipants] = useState<AuctionParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeDateParse = (dateString: string): string => {
    try {
      if (!dateString) return new Date().toISOString().split('T')[0];
      let date: Date;
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString + 'T00:00:00');
      }
      if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  // Function to convert 12-hour time back to 24-hour for calculations
  const convert12to24 = (time12h: string): string => {
    if (!time12h) return '00:00';
    
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
  };

  const transformAuctionData = (report: AuctionReport): BaseAuction => ({
    id: report.id.toString(),
    auctionNo: `AUC-${report.id.toString().padStart(3, '0')}`,
    title: report.title,
    auctionDetails: report.auction_details || report.description,
    auctionDate: safeDateParse(report.auctionDate || report.auction_date),
    // Keep the 12-hour format for display, but store original for calculations
    auctionStartTime: report.auctionStartTime || report.start_time || '10:00 AM',
    duration: 60,
    openToAllCompanies: true,
    currency: report.currency || 'INR',
    decrementalValue: report.decremental_value
  });

  const transformParticipantsData = (bids: AuctionBidSummary[]): AuctionParticipant[] =>
    bids.map((bid, index) => ({
      id: `participant-${index}`,
      userId: `user-${index}`,
      companyName: bid.company_name,
      preBidOffer: parseFloat(bid.pre_bid_offer),
      finalBid: parseFloat(bid.final_bid_offer),
      rank: `L${bid.bid_rank}`
    }));

  useEffect(() => {
    const loadAuctions = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const auctionReports = await ReportService.getAuctionReportsByUserId(user.id);
        
        const transformedAuctions: BaseAuction[] = auctionReports.map(report => ({
          id: report.id.toString(),
          auctionNo: `AUC-${report.id.toString().padStart(3, '0')}`,
          title: report.title,
          auctionDetails: report.auction_details || report.description || report.title,
          auctionDate: safeDateParse(report.auctionDate || report.auction_date),
          auctionStartTime: report.auctionStartTime || report.start_time || '10:00 AM',
          duration: 60,
          openToAllCompanies: true,
          currency: report.currency || 'INR',
          decrementalValue: report.decremental_value
        }));
        
        setAuctions(transformedAuctions);
        if (transformedAuctions.length > 0) {
          setSelectedAuction(transformedAuctions[0]);
          const firstReport = auctionReports[0];
          if (firstReport.bids && firstReport.bids.length > 0) {
            setParticipants(transformParticipantsData(firstReport.bids));
          } else {
            setParticipants([]);
          }
        }
      } catch (err) {
        console.error('Error loading auction reports:', err);
        setError('Failed to load auction reports. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    loadAuctions();
  }, [user?.id]);

  useEffect(() => {
    const loadAuctionDetails = async () => {
      if (!selectedAuction || !user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        try {
          const report = await ReportService.getAuctionReport(parseInt(selectedAuction.id));
          setSelectedAuction(transformAuctionData(report));
          if (report.bids && report.bids.length > 0) {
            setParticipants(transformParticipantsData(report.bids));
          } else {
            setParticipants([]);
          }
        } catch (reportErr) {
          console.warn('Individual auction report endpoint failed:', reportErr);
          setParticipants([]);
        }
      } catch (err) {
        console.error('Error loading auction details:', err);
        setError('Unable to load detailed auction information');
        setParticipants([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (selectedAuction) loadAuctionDetails();
  }, [selectedAuction?.id, user?.id]);

  const getEndTime = (auction: BaseAuction) => {
    try {
      // Convert 12-hour time to 24-hour for calculation
      const startTime24 = convert12to24(auction.auctionStartTime);
      const startIso = `${auction.auctionDate}T${startTime24}`;
      const start = new Date(startIso);
      if (isNaN(start.getTime())) return new Date();
      return new Date(start.getTime() + (auction.duration || 60) * 60000);
    } catch {
      return new Date();
    }
  };

  // Updated to handle both 12-hour and 24-hour formats
  const formatTimeConsistent = (date: Date | string): string => {
    try {
      // If it's already a formatted 12-hour time string, return as is
      if (typeof date === 'string' && (date.includes('AM') || date.includes('PM'))) {
        return date;
      }
      
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid Time';

      // Format as 12-hour time
      let hours = dateObj.getHours();
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      
      return `${hours}:${minutes} ${ampm}`;
    } catch {
      return 'Invalid Time';
    }
  };

  const formatDateConsistent = (date: Date | string): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid Date';

      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return 'Invalid Date';
    }
  };

  const safeFormat = (date: Date | string, formatStr: string): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return format(dateObj, formatStr);
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading && !selectedAuction) {
    return (
      <div className="ap-reports-wrapper">
        <div className="ap-reports-header">
          <div className="ap-reports-header-content">
            <div className="ap-reports-title-section">
              <h1 className="ap-reports-title">Auction Reports</h1>
              <p className="ap-reports-subtitle">Loading auction reports...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ap-reports-wrapper">
        <div className="ap-reports-header">
          <div className="ap-reports-header-content">
            <div className="ap-reports-title-section">
              <h1 className="ap-reports-title">Auction Reports</h1>
              <p className="ap-reports-subtitle">Please log in to view your auction reports</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ap-reports-wrapper">
        <div className="ap-reports-header">
          <div className="ap-reports-header-content">
            <div className="ap-reports-title-section">
              <h1 className="ap-reports-title">Auction Reports</h1>
              <p className="ap-reports-subtitle" style={{ color: '#ff6b6b' }}>{error}</p>
            </div>
            <div className="ap-reports-actions">
              <button 
                className="ap-reports-filter-select"
                onClick={() => window.location.reload()}
                style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (auctions.length === 0 && !loading) {
    return (
      <div className="ap-reports-wrapper">
        <div className="ap-reports-header">
          <div className="ap-reports-header-content">
            <div className="ap-reports-title-section">
              <h1 className="ap-reports-title">Auction Reports</h1>
              <p className="ap-reports-subtitle">No auction reports found for your account</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ap-reports-wrapper">
      <div className="ap-reports-header">
        <div className="ap-reports-header-content">
          <div className="ap-reports-title-section">
            <h1 className="ap-reports-title">Auction Reports</h1>
            <p className="ap-reports-subtitle">
              Detailed report for each auction (User ID: {user?.id})
            </p>
          </div>
          <div className="ap-reports-actions">
            <select
              className="ap-reports-filter-select"
              value={selectedAuction?.id || ''}
              onChange={e => {
                const found = auctions.find(a => a.id === e.target.value);
                setSelectedAuction(found || null);
              }}
              disabled={loading}
            >
              {auctions.map(a => (
                <option key={a.id} value={a.id}>
                  {a.auctionNo} - {a.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedAuction && (
        <div className="ap-reports-overview">
          <div className="ap-reports-overview-card">
            <div className="ap-reports-overview-header">
              <h2 className="ap-reports-overview-title">Auction Details</h2>
            </div>
            <div className="ap-reports-details-grid">
              <div>
                <strong>Auction No.</strong>
                <span>{selectedAuction.auctionNo}</span>
              </div>
              <div>
                <strong>Auction Details</strong>
                <span>{selectedAuction.auctionDetails}</span>
              </div>
              <div>
                <strong>Auction Date</strong>
                <span>{formatDateConsistent(new Date(selectedAuction.auctionDate))}</span>
              </div>
              <div>
                <strong>Start Time</strong>
                {/* Display the 12-hour format directly */}
                <span>{selectedAuction.auctionStartTime}</span>
              </div>
              <div>
                <strong>End Time</strong>
                {/* Format end time in 12-hour format */}
                <span>{formatTimeConsistent(getEndTime(selectedAuction))}</span>
              </div>
              <div>
                <strong>Open to All</strong>
                <span>{selectedAuction.openToAllCompanies ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <strong>Currency</strong>
                <span>{selectedAuction.currency}</span>
              </div>
              <div>
                <strong>Decremental Value</strong>
                <span>
                  {selectedAuction.decrementalValue
                    ? `${selectedAuction.currency} ${selectedAuction.decrementalValue}`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="ap-reports-overview-card">
            <div className="ap-reports-overview-header">
              <h2 className="ap-reports-overview-title">Bid Summary</h2>
            </div>
            <div className="ap-reports-bid-table-wrapper">
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
                  Loading bid details...
                </div>
              ) : participants.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                  <p>No bid data available for this auction</p>
                  <p style={{ fontSize: '0.9em', marginTop: '8px' }}>
                    This may be because the auction hasn't started yet or detailed bid information is not accessible.
                  </p>
                </div>
              ) : (
                <table className="ap-reports-bid-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Participant Company Name</th>
                      <th>Pre Bid Offer</th>
                      <th>Final Bid Offer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map(p => (
                      <tr key={p.id} className={p.rank === 'L1' ? 'ap-row-l1' : ''}>
                        <td data-label="Rank">
                          <span className="rank-badge">{p.rank}</span>
                        </td>
                        <td data-label="Company">{p.companyName}</td>
                        <td data-label="Pre Bid">
                          {p.preBidOffer ? `${selectedAuction.currency} ${p.preBidOffer.toLocaleString()}` : 'N/A'}
                        </td>
                        <td data-label="Final Bid">
                          {p.finalBid != null ? `${selectedAuction.currency} ${p.finalBid.toLocaleString()}` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionReports;
