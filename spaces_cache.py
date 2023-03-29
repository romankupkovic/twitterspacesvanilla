import json
import portalocker
from datetime import datetime, timedelta


class SpacesCache(object):
  CACHE_FILE = 'spaces_cache.json'

  def __init__(self):
    self.cache = []
    self.load_cache()

  def update_cache(self, space):
    current_time = datetime.now()
    space['timestamp'] = current_time.isoformat()

    # Check if the space is already in the cache
    cached_space = self.find_space(space['id'])
    if cached_space:
      # Update the cached space with the new participant count and timestamp
      cached_space['participant_count'] = space['participant_count']
      cached_space['timestamp'] = space['timestamp']
    else:
      # Add the new space to the cache
      self.cache.append(space)

    # Sort the cache based on participant_count and then timestamp
    self.cache.sort(key=lambda x: (x['participant_count'], x['timestamp']),
                    reverse=True)

    # Remove spaces exceeding the 50-item limit or with a TTL over 5 minutes
    while len(self.cache) > 50 or (
        len(self.cache) > 0
        and current_time - datetime.fromisoformat(self.cache[-1]['timestamp'])
        > timedelta(minutes=5)):
      self.cache.pop()

    self.save_cache()

  def find_space(self, space_id):
    for space in self.cache:
      if space['id'] == space_id:
        return space
    return None

  def get_cache(self):
    return self.cache

  def save_cache(self):
    with portalocker.Lock(self.CACHE_FILE, 'w') as cache_file:
      json.dump(self.cache, cache_file)

  def load_cache(self):
    try:
      with portalocker.Lock(self.CACHE_FILE, 'r') as cache_file:
        self.cache = json.load(cache_file)
    except FileNotFoundError:
      pass


spaces_cache = SpacesCache()
