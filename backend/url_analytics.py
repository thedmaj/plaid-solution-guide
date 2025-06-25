"""
URL Validation Analytics and Monitoring

Provides analytics, monitoring, and reporting capabilities for URL validation
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict, Counter
import os

logger = logging.getLogger(__name__)

@dataclass
class ValidationEvent:
    timestamp: datetime
    original_url: str
    is_valid: bool
    corrected_url: Optional[str] = None
    error_type: Optional[str] = None
    correction_method: Optional[str] = None  # 'pattern', 'claude', 'live_check'
    confidence: float = 1.0
    response_time_ms: Optional[float] = None

class URLValidationAnalytics:
    """
    Analytics engine for URL validation performance and trends
    """
    
    def __init__(self, log_file: str = "url_validation.log"):
        self.log_file = log_file
        self.events: List[ValidationEvent] = []
        self.load_events()
    
    def log_validation(self, event: ValidationEvent):
        """Log a validation event"""
        self.events.append(event)
        
        # Persist to log file
        try:
            with open(self.log_file, 'a') as f:
                event_data = asdict(event)
                event_data['timestamp'] = event.timestamp.isoformat()
                f.write(json.dumps(event_data) + '\n')
        except Exception as e:
            logger.error(f"Failed to log validation event: {e}")
    
    def load_events(self):
        """Load events from log file"""
        if not os.path.exists(self.log_file):
            return
            
        try:
            with open(self.log_file, 'r') as f:
                for line in f:
                    if line.strip():
                        data = json.loads(line)
                        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
                        self.events.append(ValidationEvent(**data))
        except Exception as e:
            logger.error(f"Failed to load validation events: {e}")
    
    def get_stats(self, hours: int = 24) -> Dict:
        """Get validation statistics for the last N hours"""
        cutoff = datetime.now() - timedelta(hours=hours)
        recent_events = [e for e in self.events if e.timestamp >= cutoff]
        
        if not recent_events:
            return {
                'period_hours': hours,
                'total_validations': 0,
                'valid_urls': 0,
                'invalid_urls': 0,
                'corrected_urls': 0,
                'success_rate': 0.0,
                'correction_rate': 0.0,
                'common_errors': {},
                'correction_methods': {},
                'avg_response_time_ms': 0.0
            }
        
        total = len(recent_events)
        valid = sum(1 for e in recent_events if e.is_valid)
        corrected = sum(1 for e in recent_events if e.corrected_url)
        
        # Error analysis
        error_counter = Counter(e.error_type for e in recent_events if e.error_type)
        
        # Correction method analysis
        correction_methods = Counter(e.correction_method for e in recent_events if e.correction_method)
        
        # Response time analysis
        response_times = [e.response_time_ms for e in recent_events if e.response_time_ms]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        return {
            'period_hours': hours,
            'total_validations': total,
            'valid_urls': valid,
            'invalid_urls': total - valid,
            'corrected_urls': corrected,
            'success_rate': valid / total if total > 0 else 0.0,
            'correction_rate': corrected / total if total > 0 else 0.0,
            'common_errors': dict(error_counter.most_common(5)),
            'correction_methods': dict(correction_methods),
            'avg_response_time_ms': avg_response_time,
            'trend_data': self._get_trend_data(recent_events)
        }
    
    def _get_trend_data(self, events: List[ValidationEvent]) -> Dict:
        """Generate trend data for visualization"""
        if not events:
            return {}
        
        # Group events by hour
        hourly_stats = defaultdict(lambda: {'total': 0, 'valid': 0, 'corrected': 0})
        
        for event in events:
            hour_key = event.timestamp.replace(minute=0, second=0, microsecond=0)
            hourly_stats[hour_key]['total'] += 1
            if event.is_valid:
                hourly_stats[hour_key]['valid'] += 1
            if event.corrected_url:
                hourly_stats[hour_key]['corrected'] += 1
        
        # Convert to time series format
        sorted_hours = sorted(hourly_stats.keys())
        return {
            'timestamps': [h.isoformat() for h in sorted_hours],
            'total_validations': [hourly_stats[h]['total'] for h in sorted_hours],
            'valid_urls': [hourly_stats[h]['valid'] for h in sorted_hours],
            'corrected_urls': [hourly_stats[h]['corrected'] for h in sorted_hours]
        }
    
    def get_problem_urls(self, limit: int = 10) -> List[Dict]:
        """Get most problematic URLs that frequently fail validation"""
        url_stats = defaultdict(lambda: {'total': 0, 'failed': 0, 'errors': []})
        
        for event in self.events:
            url_stats[event.original_url]['total'] += 1
            if not event.is_valid:
                url_stats[event.original_url]['failed'] += 1
                if event.error_type:
                    url_stats[event.original_url]['errors'].append(event.error_type)
        
        # Calculate failure rates and sort
        problem_urls = []
        for url, stats in url_stats.items():
            if stats['total'] >= 2:  # Only consider URLs seen multiple times
                failure_rate = stats['failed'] / stats['total']
                if failure_rate > 0.5:  # More than 50% failure rate
                    problem_urls.append({
                        'url': url,
                        'total_attempts': stats['total'],
                        'failures': stats['failed'],
                        'failure_rate': failure_rate,
                        'common_errors': Counter(stats['errors']).most_common(3)
                    })
        
        return sorted(problem_urls, key=lambda x: x['failure_rate'], reverse=True)[:limit]
    
    def export_report(self, hours: int = 24) -> str:
        """Export a comprehensive validation report"""
        stats = self.get_stats(hours)
        problem_urls = self.get_problem_urls()
        
        report = f"""
# URL Validation Report
Generated: {datetime.now().isoformat()}
Period: Last {hours} hours

## Summary Statistics
- Total Validations: {stats['total_validations']}
- Valid URLs: {stats['valid_urls']} ({stats['success_rate']:.1%})
- Invalid URLs: {stats['invalid_urls']}
- Corrected URLs: {stats['corrected_urls']} ({stats['correction_rate']:.1%})
- Average Response Time: {stats['avg_response_time_ms']:.1f}ms

## Common Error Types
"""
        for error, count in stats['common_errors'].items():
            report += f"- {error}: {count} occurrences\n"
        
        report += "\n## Correction Methods\n"
        for method, count in stats['correction_methods'].items():
            report += f"- {method}: {count} corrections\n"
        
        if problem_urls:
            report += "\n## Problematic URLs (High Failure Rate)\n"
            for i, url_data in enumerate(problem_urls[:5], 1):
                report += f"{i}. {url_data['url']}\n"
                report += f"   Failure Rate: {url_data['failure_rate']:.1%} ({url_data['failures']}/{url_data['total_attempts']})\n"
                report += f"   Common Errors: {', '.join([e[0] for e in url_data['common_errors']])}\n\n"
        
        return report


class URLValidationMonitor:
    """
    Real-time monitoring for URL validation performance
    """
    
    def __init__(self, analytics: URLValidationAnalytics, alert_threshold: float = 0.3):
        self.analytics = analytics
        self.alert_threshold = alert_threshold
        self._last_alert_time = None
        self._alert_cooldown = timedelta(hours=1)  # Don't spam alerts
    
    def check_health(self) -> Dict:
        """Check validation system health"""
        stats = self.analytics.get_stats(hours=1)  # Last hour
        
        health_status = "healthy"
        alerts = []
        
        # Check failure rate
        if stats['total_validations'] > 0:
            failure_rate = (stats['total_validations'] - stats['valid_urls']) / stats['total_validations']
            if failure_rate > self.alert_threshold:
                health_status = "warning"
                alerts.append(f"High failure rate: {failure_rate:.1%}")
        
        # Check response time
        if stats['avg_response_time_ms'] > 2000:  # 2 seconds
            health_status = "warning"
            alerts.append(f"Slow response time: {stats['avg_response_time_ms']:.1f}ms")
        
        # Check for pattern validation failures
        if stats['common_errors'].get('parse_error', 0) > 5:
            health_status = "warning"
            alerts.append("High number of parse errors")
        
        return {
            'status': health_status,
            'alerts': alerts,
            'stats': stats,
            'timestamp': datetime.now().isoformat()
        }
    
    def should_send_alert(self) -> bool:
        """Check if we should send an alert (respect cooldown)"""
        if self._last_alert_time is None:
            return True
        
        return datetime.now() - self._last_alert_time > self._alert_cooldown
    
    def send_alert(self, health_data: Dict):
        """Send alert notification (implement based on your notification system)"""
        if not self.should_send_alert():
            return
        
        self._last_alert_time = datetime.now()
        
        # Log the alert (in production, you might send to Slack, email, etc.)
        logger.warning(f"URL Validation Alert: {health_data}")
        
        # You could integrate with notification services here:
        # - Slack webhooks
        # - Email notifications  
        # - PagerDuty
        # - Discord webhooks
        # etc.


# Usage example for integration
def create_validation_monitoring_system():
    """Factory function to create a complete monitoring system"""
    analytics = URLValidationAnalytics()
    monitor = URLValidationMonitor(analytics)
    
    return analytics, monitor


if __name__ == "__main__":
    # Example usage
    analytics = URLValidationAnalytics()
    
    # Simulate some events
    test_events = [
        ValidationEvent(
            timestamp=datetime.now(),
            original_url="https://pliad.com/docs/api/",
            is_valid=True,
            corrected_url="https://plaid.com/docs/api/",
            correction_method="pattern",
            confidence=0.9,
            response_time_ms=150.0
        ),
        ValidationEvent(
            timestamp=datetime.now(),
            original_url="https://docs.plaid.com/invalid-path/",
            is_valid=False,
            error_type="not_reachable",
            confidence=0.8,
            response_time_ms=500.0
        )
    ]
    
    for event in test_events:
        analytics.log_validation(event)
    
    # Generate report
    report = analytics.export_report()
    print(report)
    
    # Check system health
    monitor = URLValidationMonitor(analytics)
    health = monitor.check_health()
    print("\nHealth Check:", json.dumps(health, indent=2))