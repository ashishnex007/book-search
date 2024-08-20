from rest_framework import serializers
from .models import Page, Book, Word

class WordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word
        fields = ['id', 'x', 'y', 'w', 'h', 'text']

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'description', 'thumbnail', 'source']

class PageSerializer(serializers.ModelSerializer):
    words = WordSerializer(many=True, read_only=True)
    book = BookSerializer(read_only=True)

    class Meta:
        model = Page
        fields = ['id', 'pagetitle', 'image', 'txt_file', 'words', 'book']

class LineSegmentSerializer(serializers.Serializer):
    record_id = serializers.IntegerField()
    q = serializers.CharField(max_length=255)
    reduce_type = serializers.ChoiceField(choices=[('and', 'And'), ('or', 'Or')])
    exact_match = serializers.ChoiceField(choices=[('on', 'On'), ('off', 'Off')])