import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import UploadScreen from './screens/UploadScreen';
import ProcessingScreen from './screens/ProcessingScreen';
import QualityReportScreen from './screens/QualityReportScreen';
import HumanReviewScreen from './screens/HumanReviewScreen';
import ApprovedScreen from './screens/ApprovedScreen';
import RejectedScreen from './screens/RejectedScreen';
import BatchUploadScreen from './screens/BatchUploadScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import KnowledgeBaseScreen from './screens/KnowledgeBaseScreen';
import SearchResults from './screens/SearchResults';
import ClaimsQueueScreen from './screens/ClaimsQueueScreen';
import TrashScreen from './screens/TrashScreen';
import ApiStatusScreen from './screens/ApiStatusScreen';
import LoginScreen from './screens/LoginScreen';
import { useAppContext } from './context/AppContext';

function App() {
  const { isAuthenticated } = useAppContext();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* Core Workflow */}
        <Route index element={<UploadScreen />} />
        <Route path="processing" element={<ProcessingScreen />} />
        <Route path="queue" element={<ClaimsQueueScreen />} />
        <Route path="report" element={<QualityReportScreen />} />
        <Route path="trash" element={<TrashScreen />} />
        <Route path="review" element={<HumanReviewScreen />} />
        
        {/* Results View (Post-Processing) */}
        <Route path="result/approved" element={<ApprovedScreen />} />
        <Route path="result/rejected" element={<RejectedScreen />} />

        {/* Queues (Sidebar Navigation) */}
        <Route path="approved" element={<ClaimsQueueScreen initialStatus="AUTO_PASS" />} />
        <Route path="rejected" element={<ClaimsQueueScreen initialStatus="AUTO_FAIL" />} />
        
        {/* Functional Screens */}
        <Route path="batch" element={<BatchUploadScreen />} />
        <Route path="analytics" element={<AnalyticsScreen />} />
        <Route path="knowledge-base" element={<KnowledgeBaseScreen />} />
        <Route path="status" element={<ApiStatusScreen />} />
        <Route path="search" element={<SearchResults />} />
      </Route>
    </Routes>
  );
}

export default App;
