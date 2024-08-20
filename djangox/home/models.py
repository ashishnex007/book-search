import os
from os.path import basename, join, splitext
from tempfile import TemporaryDirectory
from zipfile import ZipFile

# Create your models here.
from django.core.files import File
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from tqdm import tqdm

from django.conf import settings

from api.pageocr import PageOCR


class Book(models.Model):
	source_choices = [
		('debate', 'Debate'),
		('resume', 'Resume'),
		('review', 'Review')
	]
	title = models.CharField(max_length=200,default="")
	author = models.CharField(max_length=200,default="")
	description = models.TextField(blank=True)
	thumbnail = models.ImageField(upload_to='media/', blank=True)
	source = models.CharField(max_length=200,default='debate', choices=source_choices)
	file = models.FileField(upload_to='book_zips', blank=True)

	def __repr__(self):
		return '<Book: {} ({})>'.format(self.title, self.id)

	def __str__(self):
		return '<Book: {} ({})>'.format(self.title, self.id)

	def process_zip(self) -> list:
		extract_path = TemporaryDirectory(prefix='extract_path')
		names = []
		with ZipFile(self.file.path, 'r') as zp:
			names = zp.namelist()
			zp.extractall(extract_path.name)
		names = [join(extract_path.name, i) for i in names]
		print(names)
		image_names = [i for i in names if i.endswith('.jpg') or i.endswith('jpeg')]
		box_names = [i for i in names if i.endswith('.box')]
		print(len(image_names), len(box_names))
		error_list = []
		for image_name in tqdm(image_names):
			title = splitext(basename(image_name))[0]
			box_name = [i for i in box_names if title in i]
			if len(box_name) != 1:
				error_list.append(image_name)
				continue
			box_name = box_name[0]
			page = Page(
				pagetitle=title,
				book=self
			)
			page.image.save(basename(image_name), File(open(image_name, 'rb')))
			with open(box_name, 'r', encoding='utf-8') as f:
				boxes = f.read().strip()
			try:
				page.add_words(boxes)
			except:
				error_list.append(image_name)
				page.delete()
		return error_list

	def process_txt_file(self):
		extract_path = TemporaryDirectory(prefix='extract_path')
		names = []
		try:
			with ZipFile(self.file.path, 'r') as zp:
				names = zp.namelist()
				zp.extractall(extract_path.name)
			names = [join(extract_path.name, i) for i in names]
			names = [i for i in names if i.endswith('.txt')]
		except:
			print('Some error while opening the ZIP file in {}'.format(self.title))
			return []
		error_list = []
		for page in tqdm(self.pages.all()):
			name = [i for i in names if i.endswith(f'{page.pagetitle}.txt')]
			try:
				name = name[0]
				page.txt_file.save(basename(name), File(open(name, 'rb')))
				page.save()
			except Exception as e:
				error_list.append(page.pagetitle)
		print(f'Found {len(error_list)} errors')
		return error_list



class Page(models.Model):
	pagetitle = models.CharField(max_length=100, default='')
	book = models.ForeignKey("Book", on_delete=models.CASCADE, related_name='pages')
	image = models.ImageField(upload_to='page_images/', null=True, default=None, blank=True)
	txt_file = models.FileField(upload_to='book_txt', blank=True, null=True)

	def __str__(self):
		return '<Page: {} ({})'.format(self.pagetitle, self.book.title)

	def add_words(self, content: str):
		a = content.strip().split('\n')
		word_list = []
		for i in a:
			coords = i.strip().split('\t')[0].split(' ')
			coords = list(map(int, coords))
			text = i.strip().split('\t')[1].strip()
			word_list.append(Word(
				page=self,
				text=text,
				x=coords[0],
				y=coords[1],
				w=coords[2] - coords[0],
				h=coords[3] - coords[1],
			))
		Word.objects.bulk_create(word_list)


	def populate_content(self):
		self.content = PageOCR.fire(
			self.image.path,
			self.book.language.strip()
		)
		self.save()

	def export_words(self):
        # Use MEDIA_ROOT for dynamic path generation
		save_path = os.path.join(settings.MEDIA_ROOT, 'tmp', 'exact_matches', f'{self.id}.txt')
		save_url = os.path.join(settings.MEDIA_URL, 'tmp', 'exact_matches', f'{self.id}.txt')

        # Ensure the directory exists
		os.makedirs(os.path.dirname(save_path), exist_ok=True)

		if os.path.exists(save_path):
			return save_url

		ret = []
		for word in self.words.all():
			ret.append(word.export())
		ret = '\n'.join(ret)

        # Write the file to the dynamically determined path
		with open(save_path, 'w', encoding='utf-8') as f:
			f.write(ret.strip())

		return save_url

class Word(models.Model):
	page = models.ForeignKey(
		"Page",
		on_delete=models.CASCADE,
		related_name='words',
	)
	x = models.IntegerField(default=0)
	y = models.IntegerField(default=0)
	w = models.IntegerField(default=0)
	h = models.IntegerField(default=0)
	text = models.CharField(default='', max_length=255)

	def export(self):
		return f'{self.x}\t{self.y}\t{self.w}\t{self.h}\t{self.text}'


class Announcement(models.Model):
	ann_title = models.CharField(max_length=100,default="")
	description = models.TextField(default="")
	timestamp = models.DateTimeField(auto_now_add=True)
	active = models.BooleanField(default=True)

	def __str__(self):
		return '<Announcement: {} ({})'.format(self.ann_title,self.active)



@receiver(post_save, sender=Book)
def convert_zipimages_pdf(sender, instance, created, **kwargs):
	if created or instance.pages.count() == 0:
		instance.process_zip()
		instance.process_txt_file()
