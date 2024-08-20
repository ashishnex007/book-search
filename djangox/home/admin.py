from django.conf import settings
from django.contrib import admin
from django.contrib.admin import AdminSite
from django.contrib.auth.admin import GroupAdmin, UserAdmin
from django.contrib.auth.models import Group, User

from .models import Announcement, Book, Page, Word


class cvitAdmin(AdminSite):
    site_header = 'OCR Search Administration'
    site_title = 'OCR Search Admin'
    index_title = 'OCR Search Site Admin'
    site_url = '/search' 


#add the group and user based authorization admin page
admin_site = cvitAdmin(name='admin')
admin_site.register(Group, GroupAdmin)
admin_site.register(User, UserAdmin)


#add the models
admin_site.register(Book)
admin_site.register(Page)
# admin_site.register(Word)
# admin_site.register(Announcement)
