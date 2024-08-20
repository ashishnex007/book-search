# from django_elasticsearch_dsl import DocType, Index
from home.models import Book, Page

# books = Index('books')
# pages = Index('pages')

class DocType:
	pass

# @books.doc_type
class BookIndex(DocType):

	class Meta:
		model=Book
		fields=['id','author','title','isbn','source']

# @pages.doc_type
class PageIndex(DocType):
	class Meta:
		model=Page
		fields=['id','content']