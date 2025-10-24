"""
Utility functions for chef availability and operating hours
"""
from datetime import datetime, time
import pytz

# Sri Lanka timezone
LOCAL_TIMEZONE = pytz.timezone('Asia/Colombo')


def is_within_operating_hours(operating_hours, check_time=None):
    """
    Check if the given time is within operating hours
    
    Args:
        operating_hours: Dict with format:
            {
                "monday": {"open": "09:00", "close": "21:00", "is_open": True},
                "tuesday": {"open": "09:00", "close": "21:00", "is_open": True},
                ...
            }
        check_time: datetime object (optional, defaults to current time)
    
    Returns:
        tuple: (is_open, message, current_day_hours)
    """
    if not operating_hours or not isinstance(operating_hours, dict):
        # If no hours specified, assume always available
        return True, "Always available", None
    
    # Get current time in Sri Lanka timezone
    if check_time is None:
        check_time = datetime.now(pytz.UTC)
    
    if check_time.tzinfo is None:
        check_time = pytz.UTC.localize(check_time)
    
    local_time = check_time.astimezone(LOCAL_TIMEZONE)
    current_day = local_time.strftime('%A').lower()  # monday, tuesday, etc.
    current_time_only = local_time.time()
    
    # Get today's hours
    day_hours = operating_hours.get(current_day)
    
    if not day_hours:
        return False, f"No operating hours set for {current_day.capitalize()}", None
    
    # Check if marked as closed
    if not day_hours.get('is_open', True):
        return False, f"Closed on {current_day.capitalize()}", day_hours
    
    # Parse opening and closing times
    try:
        open_time_str = day_hours.get('open', '00:00')
        close_time_str = day_hours.get('close', '23:59')
        
        open_time = datetime.strptime(open_time_str, '%H:%M').time()
        close_time = datetime.strptime(close_time_str, '%H:%M').time()
        
        # Handle cases where closing time is after midnight
        if close_time < open_time:
            # Restaurant open past midnight
            if current_time_only >= open_time or current_time_only <= close_time:
                return True, f"Open until {close_time_str}", day_hours
            else:
                return False, f"Opens at {open_time_str}", day_hours
        else:
            # Normal hours
            if open_time <= current_time_only <= close_time:
                return True, f"Open until {close_time_str}", day_hours
            else:
                if current_time_only < open_time:
                    return False, f"Opens at {open_time_str}", day_hours
                else:
                    return False, f"Closed (opens tomorrow at {open_time_str})", day_hours
                    
    except (ValueError, KeyError) as e:
        return False, f"Invalid operating hours format: {str(e)}", day_hours


def format_operating_hours_readable(operating_hours):
    """
    Convert operating hours dict to human-readable format
    
    Args:
        operating_hours: Dict with operating hours
    
    Returns:
        str: Formatted string like "Mon-Fri: 9:00 AM - 9:00 PM, Sat-Sun: 10:00 AM - 8:00 PM"
    """
    if not operating_hours or not isinstance(operating_hours, dict):
        return "Hours not specified"
    
    days_order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    day_abbrev = {
        'monday': 'Mon',
        'tuesday': 'Tue',
        'wednesday': 'Wed',
        'thursday': 'Thu',
        'friday': 'Fri',
        'saturday': 'Sat',
        'sunday': 'Sun'
    }
    
    # Group consecutive days with same hours
    groups = []
    current_group = None
    
    for day in days_order:
        day_hours = operating_hours.get(day, {})
        
        if not day_hours.get('is_open', True):
            # Day is closed
            if current_group:
                groups.append(current_group)
                current_group = None
            continue
        
        open_time = day_hours.get('open', '00:00')
        close_time = day_hours.get('close', '23:59')
        hours_str = f"{open_time} - {close_time}"
        
        if current_group and current_group['hours'] == hours_str:
            # Same hours as previous day, extend the group
            current_group['end_day'] = day
        else:
            # Different hours, start new group
            if current_group:
                groups.append(current_group)
            current_group = {
                'start_day': day,
                'end_day': day,
                'hours': hours_str
            }
    
    # Add last group
    if current_group:
        groups.append(current_group)
    
    # Format groups into readable strings
    readable_parts = []
    for group in groups:
        start = day_abbrev[group['start_day']]
        end = day_abbrev[group['end_day']]
        
        if start == end:
            day_range = start
        else:
            day_range = f"{start}-{end}"
        
        # Convert 24-hour to 12-hour format
        try:
            open_time = datetime.strptime(group['hours'].split(' - ')[0], '%H:%M')
            close_time = datetime.strptime(group['hours'].split(' - ')[1], '%H:%M')
            hours_12 = f"{open_time.strftime('%I:%M %p')} - {close_time.strftime('%I:%M %p')}"
        except:
            hours_12 = group['hours']
        
        readable_parts.append(f"{day_range}: {hours_12}")
    
    return ", ".join(readable_parts) if readable_parts else "Closed"


def get_default_operating_hours():
    """
    Get default operating hours (9 AM - 9 PM, all days)
    
    Returns:
        dict: Default operating hours
    """
    return {
        "monday": {"open": "09:00", "close": "21:00", "is_open": True},
        "tuesday": {"open": "09:00", "close": "21:00", "is_open": True},
        "wednesday": {"open": "09:00", "close": "21:00", "is_open": True},
        "thursday": {"open": "09:00", "close": "21:00", "is_open": True},
        "friday": {"open": "09:00", "close": "21:00", "is_open": True},
        "saturday": {"open": "09:00", "close": "21:00", "is_open": True},
        "sunday": {"open": "09:00", "close": "21:00", "is_open": True}
    }

