from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import requests
import os

app = Flask(__name__, static_folder='static')
CORS(app, resources={r'*': {'origins': '*'}})  # Enable CORS for all origins
TWITTER_BEARER_TOKEN = os.environ.get("TWITTER_BEARER_TOKEN")

bearer_token = TWITTER_BEARER_TOKEN
search_url = "https://api.twitter.com/2/spaces/search"
spaces_lookup_url = "https://api.twitter.com/2/spaces"


def create_headers(bearer_token):
  headers = {
    "Authorization": "Bearer {}".format(bearer_token),
    "User-Agent": "v2SpacesLookupPython"
  }
  return headers


@app.route('/spaces', methods=['GET'])
def spaces_lookup():
  ids = request.args.get('ids')
  space_fields = request.args.get('space.fields')
  expansions = request.args.get('expansions')

  query_params = {
    'ids': ids,
    'space.fields': space_fields,
    'expansions': expansions
  }

  headers = create_headers(bearer_token)
  response = requests.get(spaces_lookup_url,
                          headers=headers,
                          params=query_params)

  if response.status_code != 200:
    return jsonify({"error": "Error fetching data from Twitter API"
                    }), response.status_code

  return jsonify(response.json())


@app.route('/static/<path:path>')
def serve_static(path):
  return send_from_directory('static', path)


@app.route('/')
def index():
  return render_template('index.html')


@app.route('/search', methods=['GET'])
def search():
  query = request.args.get('query')
  state = request.args.get('state')
  space_fields = request.args.get('space.fields')
  expansions = request.args.get('expansions')
  max_results = request.args.get('max_results')

  query_params = {
    'query': query,
    'state': state,
    'space.fields': space_fields,
    'expansions': expansions,
    'max_results': max_results
  }

  headers = create_headers(bearer_token)
  response = requests.get(search_url, headers=headers, params=query_params)

  if response.status_code != 200:
    return jsonify({"error": "Error fetching data from Twitter API"
                    }), response.status_code

  return jsonify(response.json())


if __name__ == '__main__':
  app.run(host='0.0.0.0')
