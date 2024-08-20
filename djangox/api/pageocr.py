import requests
from os.path import basename

class PageOCR:
    
	def fire(image_path: str, language: str):
		language = language.lower().strip()

		url = "http://bhasha.iiit.ac.in/pageocr/api"

		payload={'language': language, 'version': 'v4_robust'}
		files=[
			('image',(basename(image_path),open(image_path,'rb'),'image/jpeg'))
		]
		headers = {}

		response = requests.post(url, headers=headers, data=payload, files=files)

		return response.json()['text'].strip()