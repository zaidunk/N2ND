from sentence_transformers import SentenceTransformer
print('loading model all-MiniLM-L6-v2...')
model = SentenceTransformer('all-MiniLM-L6-v2')
print('model loaded. dim =', model.get_sentence_embedding_dimension())
